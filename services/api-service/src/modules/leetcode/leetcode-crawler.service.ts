import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { LeetCodeProblemRepository } from './repositories';

@Injectable()
export class LeetCodeCrawlerService {
  private readonly logger = new Logger(LeetCodeCrawlerService.name);
  private readonly apiUrl = 'https://leetcode.com/api/problems/all/';
  private readonly graphqlUrl = 'https://leetcode.com/graphql';
  private readonly headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Origin': 'https://leetcode.com',
    'Referer': 'https://leetcode.com'
  };

  constructor(private readonly leetCodeProblemRepository: LeetCodeProblemRepository) { }

  @Cron('0 0 * * *') // Chạy mỗi ngày lúc 00:00
  async handleCron() {
    this.logger.log('⏰ Cron started: Crawling LeetCode problems');
    await this.crawlAllProblems();
  }

  async crawlAllProblems() {
    try {
      this.logger.log('🔍 Starting to crawl LeetCode problems...');

      // Lấy danh sách tất cả các bài toán từ API public
      const response = await axios.get(this.apiUrl, { headers: this.headers });
      const problems = response.data.stat_status_pairs;

      this.logger.log(`📋 Found ${problems.length} problems`);

      // Xử lý từng bài toán
      for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];
        if (!problem.stat.question__hide) {
          await this.processProblem({
            questionId: problem.stat.question_id,
            titleSlug: problem.stat.question__title_slug,
            title: problem.stat.question__title,
            difficulty: ['Easy', 'Medium', 'Hard'][problem.difficulty.level - 1],
            acRate: (problem.stat.total_acs / problem.stat.total_submitted * 100).toFixed(2),
          });
        }

        // Log tiến trình
        if ((i + 1) % 10 === 0 || i === problems.length - 1) {
          this.logger.log(`⏳ Processed ${i + 1}/${problems.length} problems`);
        }

        // Thêm delay để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      this.logger.log('✅ Completed crawling all LeetCode problems');
    } catch (error) {
      this.logger.error('❌ Failed to crawl LeetCode problems', error.stack);
    }
  }

  async processProblem(problemBasic: any) {
    try {
      const { titleSlug, questionId } = problemBasic;

      // Kiểm tra xem bài toán đã tồn tại trong DB chưa
      const existingProblem = await this.leetCodeProblemRepository.findByTitleSlug(titleSlug);
      if (existingProblem) {
        this.logger.debug(`⏩ Problem "${problemBasic.title}" already exists, skipping...`);
        return;
      }

      // Lấy thông tin chi tiết của bài toán qua GraphQL
      const problemDetail = await this.fetchProblemDetail(titleSlug);
      if (!problemDetail) {
        this.logger.warn(`⚠️ Failed to fetch details for problem "${problemBasic.title}"`);
        return;
      }

      // Chuẩn bị dữ liệu để lưu vào DB
      const problem = {
        problemId: parseInt(questionId, 10),
        title: problemBasic.title,
        titleSlug: titleSlug,
        difficulty: problemBasic.difficulty,
        content: problemDetail.content,
        topicTags: problemDetail.topicTags.map((tag: any) => tag.name),
        likes: problemDetail.likes,
        dislikes: problemDetail.dislikes,
        acceptanceRate: parseFloat(problemBasic.acRate),
        frequency: 0,
        examples: this.extractExamples(problemDetail.content),
        hints: problemDetail.hints || [],
        codeSnippets: (problemDetail.codeSnippets || []).map((snippet: any) => ({
          language: snippet.lang,
          code: snippet.code,
        })),
        sourceUrl: `https://leetcode.com/problems/${titleSlug}/`,
        testcases: problemDetail.testcases || []
      };

      // Lưu bài toán vào DB
      await this.leetCodeProblemRepository.create(problem);
      this.logger.debug(`✅ Saved problem: "${problem.title}"`);
    } catch (error) {
      this.logger.error(`❌ Failed to process problem: ${problemBasic.title}`, error.stack);
    }
  }

  async fetchProblemDetail(titleSlug: string) {
    try {
      const response = await axios.post(
        this.graphqlUrl,
        {
          query: `
            query getQuestionDetail($titleSlug: String!) {
              question(titleSlug: $titleSlug) {
                questionId
                questionFrontendId
                boundTopicId
                title
                titleSlug
                content
                translatedTitle
                translatedContent
                isPaidOnly
                difficulty
                likes
                dislikes
                isLiked
                similarQuestions
                contributors {
                  username
                  profileUrl
                  avatarUrl
                  __typename
                }
                langToValidPlayground
                topicTags {
                  name
                  slug
                  translatedName
                  __typename
                }
                companyTagStats
                codeSnippets {
                  lang
                  langSlug
                  code
                  __typename
                }
                stats
                hints
                solution {
                  id
                  canSeeDetail
                  __typename
                }
                status
                sampleTestCase
                metaData
                judgerAvailable
                judgeType
                mysqlSchemas
                enableRunCode
                enableTestMode
                envInfo
                __typename
              }
            }
          `,
          variables: { titleSlug }
        },
        {
          headers: this.headers
        }
      );

      const questionData = response.data.data.question;
      const metaData = JSON.parse(questionData.metaData || '{}');
      const sampleTestCase = questionData.sampleTestCase;

      // Parse test cases from metadata and sample test case
      const testcases = this.parseTestCases(metaData, sampleTestCase);

      return {
        ...questionData,
        testcases
      };
    } catch (error) {
      this.logger.error(`❌ Failed to fetch problem detail for ${titleSlug}`, error.stack);
      return null;
    }
  }

  parseTestCases(metaData: any, sampleTestCase: string): any[] {
    try {
      const params = metaData.params || [];
      const testcases: any[] = [];

      // Nếu không có metadata hoặc sample test case, return empty array
      if (!params.length || !sampleTestCase) {
        return [];
      }

      // Split sample test case into lines and clean up
      const testLines = sampleTestCase
        .split('\n')
        .map(line => line.trim())
        .filter(line => line);

      // Parse each test case line
      for (const line of testLines) {
        try {
          // Remove any trailing commas
          const cleanLine = line.replace(/,\s*$/, '');

          // Parse values using JSON.parse to handle arrays and other complex types
          const values = cleanLine.split(',').map(val => {
            try {
              // Clean up the value and ensure it's valid JSON
              const cleanVal = val.trim()
                .replace(/^["']+|["']+$/g, '') // Remove quotes
                .replace(/\\"/g, '"'); // Handle escaped quotes

              return JSON.parse(cleanVal);
            } catch {
              // If JSON.parse fails, return the original cleaned value
              return val.trim();
            }
          });

          // Ensure we have enough values for all params
          if (values.length >= params.length) {
            const testCase = {
              params: params.map((param: any, index: number) => {
                let value = values[index];

                // Convert value to match the parameter type
                switch (param.type.toLowerCase()) {
                  case 'integer':
                  case 'int':
                    value = parseInt(value, 10);
                    break;
                  case 'double':
                  case 'float':
                    value = parseFloat(value);
                    break;
                  case 'string':
                    value = String(value);
                    break;
                  case 'boolean':
                    value = Boolean(value);
                    break;
                  // Handle array types
                  case 'integer[]':
                  case 'int[]':
                    value = Array.isArray(value) ? value.map(v => parseInt(v, 10)) : [];
                    break;
                  case 'string[]':
                    value = Array.isArray(value) ? value.map(String) : [];
                    break;
                }

                return {
                  name: param.name,
                  type: param.type,
                  value: JSON.stringify(value) // Store as JSON string for consistency
                };
              }),
              expected: JSON.stringify(values[values.length - 1]) // Store expected value as JSON string
            };

            testcases.push(testCase);
          }
        } catch (error) {
          this.logger.warn(`Failed to parse test case line: ${line}`, error);
          continue;
        }
      }

      // Validate and clean up test cases
      return testcases.filter(testCase =>
        testCase.params.every(param => param.value !== undefined) &&
        testCase.expected !== undefined
      );

    } catch (error) {
      this.logger.error('❌ Failed to parse test cases', error);
      return [];
    }
  }

  extractExamples(content: string): { input: string; output: string; explanation?: string }[] {
    const examples: { input: string; output: string; explanation?: string }[] = [];

    try {
      // Tìm các ví dụ trong nội dung HTML
      const exampleBlocks = content.match(/<div class="example-block">([\s\S]*?)<\/div>/g) || [];

      for (const block of exampleBlocks) {
        const inputMatch = /<strong>Input:<\/strong>\s*<span class="example-io">(.*?)<\/span>/s.exec(block);
        const outputMatch = /<strong>Output:<\/strong>\s*<span class="example-io">(.*?)<\/span>/s.exec(block);
        const explanationMatch = /<p><strong>Explanation:<\/strong><\/p>\s*([\s\S]*?)(?=<\/div>|$)/s.exec(block);

        if (inputMatch && outputMatch) {
          examples.push({
            input: this.cleanHtml(inputMatch[1]),
            output: this.cleanHtml(outputMatch[1]),
            explanation: explanationMatch ? this.cleanHtml(explanationMatch[1]) : undefined,
          });
        }
      }
    } catch (error) {
      this.logger.error('❌ Failed to extract examples from content', error.stack);
    }

    return examples;
  }

  cleanHtml(html: string): string {
    // Loại bỏ các thẻ HTML và chuẩn hóa khoảng trắng
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim();
  }
} 