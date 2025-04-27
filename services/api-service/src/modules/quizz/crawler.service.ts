import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuizRepository } from './repositories';
import { decode } from 'html-entities';
import { shuffleArray } from '@utils';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly baseUrl = 'https://www.geeksforgeeks.org';

  constructor(
    private readonly quizRepository: QuizRepository,
  ) { }

  // @Cron('0 0 * * *') // chạy mỗi ngày lúc 00:00
  // async handleCron() {
  //   console.log('⏰ Cron started: Crawling GFG quizzes');
  //   await this.crawlAllCategories();
  // }

  async crawlAllCategories() {
    try {
      const { data } = await axios.get('https://www.geeksforgeeks.org/gfg-assets/_next/data/-uH_KENydbtNja4B62K3E/quizzes.json');
      const categories = data?.pageProps?.quizCategoryData ?? [];

      console.log(`🔍 Crawling all categories recursively...`);

      // Đệ quy lấy quiz từ từng category
      const crawlCategory = async (slug: string, categoryName: string) => {
        try {
          console.log(`📂 Fetching quizzes from category: ${categoryName} (slug: ${slug})`);

          const url = `https://www.geeksforgeeks.org/gfg-assets/_next/data/-uH_KENydbtNja4B62K3E/quizzes.json?category=${slug}`;
          const { data: catData } = await axios.get(url);

          const quizzes = catData?.pageProps?.quizLandingPageData?.results ?? [];

          if (quizzes.length === 0) {
            console.log(`ℹ️ No quizzes found under category: ${categoryName}`);
            return;
          }

          for (const quiz of quizzes) {
            const quizSlug = quiz.slug;
            const quizTitle = quiz.title;
            console.log(`📝 Crawling quiz: ${quizTitle} (slug: ${quizSlug})`);

            await this.crawlQuizDetail(quizSlug, categoryName, quizTitle);
          }
        } catch (err) {
          console.error(`❌ Failed to crawl category: ${categoryName} (${slug})`, err);
        }
      };

      // Đệ quy traverse category tree
      const traverseCategories = async (cats: any[], parentName: string = '') => {
        for (const cat of cats) {
          const currentCategoryName = parentName ? `${parentName} > ${cat.name}` : cat.name;

          // Nếu category này có children => đệ quy sâu hơn
          if (cat.children && cat.children.length > 0) {
            await traverseCategories(cat.children, currentCategoryName);
          }

          // Luôn crawl quiz của category hiện tại
          await crawlCategory(cat.slug, currentCategoryName);
        }
      };

      await traverseCategories(categories);

      console.log(`✅ Completed crawling all categories.`);
    } catch (err) {
      console.error('❌ Failed to load initial categories from API', err);
    }
  }


  async crawlQuizDetail(slug: string, category: string, quizTitle: string) {
    let page = 1;
    const pageSize = 10;
    const questions = [];

    while (true) {
      try {
        const res = await axios.get(`https://apiwrite.geeksforgeeks.org/quiz/gfg/${slug}/?page_size=${pageSize}&page=${page}`);
        const data = res.data;

        if (!data.results || data.results.length === 0) {
          console.warn(`⚠️ No questions found for quiz: https://apiwrite.geeksforgeeks.org/quiz/gfg/${slug}/?page_size=${pageSize}&page=${page}`);
          break;
        }

        for (const q of data.results || []) {
          const questionText = this.decodeHtml(q.question || '');
          const rawOptions = q.answers.map((opt) => this.decodeHtml(opt.answer));
          const correctAnswerText = q.answers.find((opt) => opt.correct)?.answer || '';
          const explanation = this.decodeHtml(q.explanation || '');

          let options = [...rawOptions];
          if (correctAnswerText && !options.includes(correctAnswerText)) {
            options.push(correctAnswerText);
          }

          options = shuffleArray(options);
          const correctAnswerIndex = options.findIndex((opt) => opt === correctAnswerText);

          if (questionText && options.length > 0 && correctAnswerIndex !== -1) {
            questions.push({
              question: questionText,
              options,
              correctAnswer: correctAnswerIndex,
              explanation,
            });
          }
        }

        if (!data.next) break;
        page++;
      } catch (err) {
        console.warn(`⚠️ Failed to fetch page ${page} for quiz: ${quizTitle}: ${slug}`);
        break;
      }
    }

    if (questions.length > 0) {
      // Chuyển category từ "AI-ML-DS > Deep Learning" thành ["AI-ML-DS", "Deep Learning"]
      const categories = category.split('>').map(c => c.trim());

      await this.quizRepository.create({
        title: quizTitle,
        categories,
        sourceUrl: `https://www.geeksforgeeks.org/quizzes/${slug}/`,
        questions,
      });

      console.log(`✅ Saved quiz: ${quizTitle} with ${questions.length} questions`);
    } else {
      console.log(`ℹ️ No questions found for quiz: ${quizTitle}`);
    }
  }


  decodeHtml(text: string): string {
    return decode(text);
  }

}
