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

      // Đảm bảo content không bị null
      const content = problemDetail.content || '';

      // Chuẩn bị dữ liệu để lưu vào DB - loại bỏ các trường không cần thiết
      const problem = {
        problemId: parseInt(questionId, 10),
        title: problemBasic.title,
        titleSlug: titleSlug,
        difficulty: problemBasic.difficulty,
        content: content,
        topicTags: (problemDetail.topicTags || []).map((tag: any) => tag.name),
        examples: this.extractExamples(content),
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
      this.logger.debug(`✅ Saved problem: "${problem.title}". Examples: ${problem.examples.length}, Testcases: ${problem.testcases.length}`);
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

      // Parse test cases từ examples trong content
      const testcases = this.parseTestCasesFromExamples(questionData.content, metaData);

      return {
        ...questionData,
        testcases
      };
    } catch (error) {
      this.logger.error(`❌ Failed to fetch problem detail for ${titleSlug}`, error.stack);
      return null;
    }
  }

  parseTestCasesFromExamples(content: string, metaData: any): any[] {
    const testcases: any[] = [];

    try {
      if (!content) {
        return [];
      }

      const paramsMeta = metaData?.params || [];

      // Cải thiện regex để bắt tất cả example blocks, kể cả trong content dài
      const exampleRegex = /<div class="example-block">([\s\S]*?)<\/div>/g;
      let exampleMatch;
      const exampleBlocks = [];

      // Dùng while loop với regex.exec thay vì match để xử lý content dài
      while ((exampleMatch = exampleRegex.exec(content)) !== null) {
        exampleBlocks.push(exampleMatch[0]);
      }

      if (exampleBlocks.length === 0) {
        // Nếu không tìm thấy example blocks theo định dạng mới, thử với định dạng cũ
        const oldExampleRegex = /<strong class="example">Example \d+:<\/strong>([\s\S]*?)(?=<strong class="example">|<p><strong>Constraints:|$)/g;
        while ((exampleMatch = oldExampleRegex.exec(content)) !== null) {
          exampleBlocks.push(`<div class="example-block">${exampleMatch[1]}</div>`);
        }
      }

      for (const block of exampleBlocks) {
        // Lấy input - hỗ trợ cả định dạng mới và cũ
        const inputMatch = block.match(/<strong>Input:<\/strong>\s*(?:<span class="example-io">(.*?)<\/span>|:?\s*(.*?)(?=<strong|<\/p>))/s);

        // Lấy output - hỗ trợ cả định dạng mới và cũ
        const outputMatch = block.match(/<strong>Output:<\/strong>\s*(?:<span class="example-io">(.*?)<\/span>|:?\s*(.*?)(?=<strong|<\/p>))/s);

        // Lấy explanation
        const explanationMatch = block.match(/<(?:p><)?strong>Explanation:<\/strong>(?:<\/p>)?\s*([\s\S]*?)(?=<\/div>|<\/ul>|<strong|$)/s);

        if (inputMatch && outputMatch) {
          // Xử lý input string
          const inputContent = inputMatch[1] || inputMatch[2] || '';
          let inputStr = this.cleanHtml(inputContent);

          // Parse params từ input string
          const params: any[] = [];

          if (paramsMeta.length > 0) {
            // Nếu có metadata về params
            const inputParts = inputStr.split(',').map(part => part.trim());
            let inputValues: { [key: string]: any } = {};

            // Parse input string theo format "name = value"
            for (const part of inputParts) {
              const match = part.match(/([a-zA-Z0-9_]+)\s*=\s*(.+)/);
              if (match) {
                const [_, name, rawValue] = match;
                inputValues[name] = rawValue.trim();
              }
            }

            // Tạo params theo metadata
            for (const paramMeta of paramsMeta) {
              const rawValue = inputValues[paramMeta.name] || '';
              let value: any;

              // Convert raw value theo type
              switch (paramMeta.type.toLowerCase()) {
                case 'integer':
                case 'int':
                  // Xử lý số nguyên
                  value = parseInt(rawValue.replace(/[^0-9\-]/g, ''), 10);
                  break;
                case 'string':
                  // Xử lý chuỗi - loại bỏ dấu ngoặc kép
                  value = rawValue.replace(/^\["']|["']$/g, '');
                  break;
                case 'integer[]':
                case 'int[]':
                  // Xử lý mảng số
                  try {
                    const arrayStr = rawValue.replace(/^\[|\]$/g, '');
                    value = arrayStr.split(',').map(v => parseInt(v.trim(), 10));
                  } catch {
                    value = [];
                  }
                  break;
                case 'string[]':
                  // Xử lý mảng chuỗi
                  try {
                    const arrayStr = rawValue.replace(/^\[|\]$/g, '');
                    value = arrayStr.split(',').map(v => v.trim().replace(/^\["']|["']$/g, ''));
                  } catch {
                    value = [];
                  }
                  break;
                default:
                  value = rawValue;
              }

              params.push({
                name: paramMeta.name,
                type: paramMeta.type,
                value: JSON.stringify(value)
              });
            }
          } else {
            // Nếu không có metadata, lưu raw input
            params.push({
              name: 'input',
              type: 'string',
              value: JSON.stringify(inputStr)
            });
          }

          // Xử lý output
          const outputContent = outputMatch[1] || outputMatch[2] || '';
          let expected = this.cleanHtml(outputContent);

          // Thử convert expected thành định dạng phù hợp
          try {
            // Xem output là gì (số, chuỗi, mảng, ...)
            if (/^\d+$/.test(expected)) {
              // Nếu là số nguyên
              expected = JSON.stringify(parseInt(expected, 10));
            } else if (/^\d+\.\d+$/.test(expected)) {
              // Nếu là số thực
              expected = JSON.stringify(parseFloat(expected));
            } else if (/^\[.*\]$/.test(expected)) {
              // Nếu là mảng
              expected = JSON.stringify(JSON.parse(expected.replace(/'/g, '"')));
            } else {
              // Mặc định là string, loại bỏ dấu ngoặc kép nếu có
              expected = JSON.stringify(expected.replace(/^\["']|["']$/g, ''));
            }
          } catch (e) {
            // Nếu parse lỗi, giữ nguyên chuỗi và đưa vào JSON
            expected = JSON.stringify(expected);
          }

          let explanation = undefined;
          if (explanationMatch && explanationMatch[1]) {
            explanation = this.cleanHtml(explanationMatch[1]);
          }

          testcases.push({
            params,
            expected,
            explanation
          });
        }
      }

      return testcases;
    } catch (error) {
      this.logger.error('❌ Failed to parse test cases from examples', error.stack);
      return [];
    }
  }

  extractExamples(content: string): { input: string; output: string; explanation?: string }[] {
    const examples: { input: string; output: string; explanation?: string }[] = [];

    try {
      if (!content) {
        return [];
      }

      // Tìm các ví dụ trong nội dung HTML với regex được cải thiện
      const exampleRegex = /<div class="example-block">([\s\S]*?)<\/div>/g;
      let exampleMatch;
      const exampleBlocks = [];

      // Dùng while loop với regex.exec thay vì match để xử lý content dài
      while ((exampleMatch = exampleRegex.exec(content)) !== null) {
        exampleBlocks.push(exampleMatch[0]);
      }

      if (exampleBlocks.length === 0) {
        // Nếu không tìm thấy example blocks theo định dạng mới, thử với định dạng cũ
        const oldExampleRegex = /<strong class="example">Example \d+:<\/strong>([\s\S]*?)(?=<strong class="example">|<p><strong>Constraints:|$)/g;
        while ((exampleMatch = oldExampleRegex.exec(content)) !== null) {
          exampleBlocks.push(`<div class="example-block">${exampleMatch[1]}</div>`);
        }
      }

      for (const block of exampleBlocks) {
        // Support cho cả định dạng mới và cũ
        const inputMatch = block.match(/<strong>Input:<\/strong>\s*(?:<span class="example-io">(.*?)<\/span>|:?\s*(.*?)(?=<strong|<\/p>))/s);
        const outputMatch = block.match(/<strong>Output:<\/strong>\s*(?:<span class="example-io">(.*?)<\/span>|:?\s*(.*?)(?=<strong|<\/p>))/s);
        const explanationMatch = block.match(/<(?:p><)?strong>Explanation:<\/strong>(?:<\/p>)?\s*([\s\S]*?)(?=<\/div>|<\/ul>|<strong|$)/s);

        if (inputMatch && outputMatch) {
          const inputContent = inputMatch[1] || inputMatch[2] || '';
          const outputContent = outputMatch[1] || outputMatch[2] || '';

          examples.push({
            input: this.cleanHtml(inputContent),
            output: this.cleanHtml(outputContent),
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