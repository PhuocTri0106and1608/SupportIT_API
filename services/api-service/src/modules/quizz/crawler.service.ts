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
  //   this.logger.log('⏰ Cron started: Crawling GFG quizzes');
  //   await this.crawlAllCategories();
  // }

  async crawlAllCategories() {
    try {
      const { data } = await axios.get(`${this.baseUrl}/quizzes/`);
      const $ = cheerio.load(data);
      const categoryLinks: { title: string; href: string }[] = [];

      $('a[href^="/quizzes/?category="]').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();

        // Lọc các link có text rõ ràng
        if (href && title && !title.toLowerCase().includes('view all')) {
          categoryLinks.push({ title, href: `${this.baseUrl}${href}` });
        }
      });

      for (const cat of categoryLinks) {
        this.logger.log(`🔍 Crawling category: ${cat.title}`);
        try {
          await this.crawlQuizzesInCategory(cat.href, cat.title);
        } catch (err) {
          this.logger.warn(`⚠️ Skip category (error): ${cat.title}`);
        }
      }
    } catch (err) {
      this.logger.error('❌ Failed to load categories');
    }
  }

  async crawlQuizzesInCategory(categoryUrl: string, categoryTitle: string) {
    const res = await axios.get(categoryUrl);
    const $ = cheerio.load(res.data);
    const quizLinks = [];

    $('a[href*="/quizzes/"]').each((_, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      const isQuizPage = href && href.includes('/quizzes/') && !href.includes('?category=');

      if (isQuizPage && title.length > 0) {
        quizLinks.push({ title, href });
      }
    });

    for (const quiz of quizLinks) {
      try {
        await this.crawlQuizDetail(quiz.href, categoryTitle, quiz.title.split(':')[0].trim());
      } catch (err) {
        this.logger.warn(`⚠️ Skip quiz (login/protected): ${quiz.title.split(':')[0].trim()}`);
      }
    }
  }

  async crawlQuizDetail(url: string, category: string, quizTitle: string) {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    const $ = cheerio.load(res.data);

    const jsonScripts = $('script[type="application/ld+json"]')
      .map((_, el) => $(el).html())
      .get();

    const quizJsonRaw = jsonScripts.find((txt) => txt?.includes('"@type":"Quiz"'));
    if (!quizJsonRaw) {
      console.warn('❌ Không tìm thấy dữ liệu Quiz trong script JSON');
      return;
    }

    let quizData;
    try {
      quizData = JSON.parse(quizJsonRaw);
    } catch (err) {
      console.error('❌ Lỗi parse JSON:', err);
      return;
    }

    const questions = [];

    for (const q of quizData.hasPart || []) {
      const questionText = this.decodeHtml(q.text || q.name || '');

      const rawOptions = (q.suggestedAnswer || []).map((opt) =>
        this.decodeHtml(opt.text),
      );

      const correctText = this.decodeHtml(q.acceptedAnswer?.text || '');
      const explanation = this.decodeHtml(q.acceptedAnswer?.answerExplanation?.text || '');

      let options = [...rawOptions];
      if (!options.includes(correctText)) {
        options.push(correctText);
      }

      // Shuffle viết tay
      options = shuffleArray(options);

      const correctAnswerIndex = options.findIndex((opt) => opt === correctText);

      if (questionText && options.length > 0 && correctAnswerIndex !== -1) {
        questions.push({
          question: questionText,
          options,
          correctAnswer: correctAnswerIndex,
          explanation,
        });
      }
    }

    if (questions.length > 0) {
      await this.quizRepository.create({
        title: quizTitle,
        category,
        questions,
        sourceUrl: url,
      });
    }

    this.logger.log(`✅ ${quizTitle}: ${questions.length} câu hỏi`);
  }


  decodeHtml(text: string): string {
    return decode(text); // dùng thư viện html-entities
  }
}
