import { Injectable, Logger } from '@nestjs/common';
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
      this.logger.debug(`✅ Saved problem: "${problem.title}". Testcases: ${problem.testcases.length}`);
    } catch (error) {
      this.logger.error(`❌ Failed to process problem: ${problemBasic.title}`, error.stack);
    }
  }

  async fetchProblemDetail(titleSlug: string) {
    try {
      // Query bổ sung thêm nhiều trường hữu ích từ API GraphQL
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
                exampleTestcases
                categoryTitle
                contributors {
                  username
                  profileUrl
                  avatarUrl
                  __typename
                }
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
                  paidOnly
                  hasVideoSolution
                  paidOnlyVideo
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
                enableDebugger
                envInfo
                libraryUrl
                adminUrl
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

      // Lấy metadata và sample test cases
      const metaData = JSON.parse(questionData.metaData || '{}');
      const exampleTestcases = questionData.exampleTestcases || questionData.sampleTestCase || '';

      // Kiểm tra loại bài toán (SQL, Algo, v.v.)
      const isSqlProblem = (questionData.categoryTitle === 'Database' ||
        (questionData.codeSnippets || []).some(snippet =>
          ['MySQL', 'MS SQL Server', 'Oracle', 'PostgreSQL'].includes(snippet.lang)));

      // Lấy testcases từ API hoặc phân tích từ nội dung
      let testcases = [];

      if (isSqlProblem) {
        // Xử lý đặc biệt cho các bài SQL
        testcases = this.parseSqlTestCases(questionData.content, metaData);
      } else {
        // Trích xuất testcases từ nội dung HTML
        testcases = this.parseTestCasesFromExamples(questionData.content, metaData);

        // Nếu không có testcases từ HTML, dùng exampleTestcases từ API
        if (testcases.length === 0 && exampleTestcases) {
          testcases = this.parseTestCasesFromApi(exampleTestcases, metaData);
        }
      }

      // Truy vấn thêm API để lấy test cases đầy đủ nếu có
      try {
        const detailedTestCases = await this.fetchDetailedTestCases(titleSlug, questionData.questionId);
        if (detailedTestCases && detailedTestCases.length > 0) {
          testcases = detailedTestCases;
        }
      } catch (error) {
        this.logger.warn(`Không thể lấy detailed test cases cho ${titleSlug}, sử dụng test cases cơ bản`);
      }

      // Trả về kết quả
      return {
        ...questionData,
        testcases
      };
    } catch (error) {
      this.logger.error(`❌ Failed to fetch problem detail for ${titleSlug}`, error.stack);
      return null;
    }
  }

  async fetchDetailedTestCases(titleSlug: string, questionId: string): Promise<any[]> {
    try {
      // Thử lấy test cases từ API interpret endpoint (LeetCode sử dụng nội bộ)
      const response = await axios.post(
        'https://leetcode.com/problems/interpret',
        {
          question_id: questionId,
          data_input: null, // Để lấy test cases mặc định
          lang: "javascript", // Có thể sử dụng bất kỳ ngôn ngữ được hỗ trợ
          judge_type: "large", // Thường sẽ có test cases đầy đủ hơn
          typed_code: "// Empty code" // Chỉ cần một placeholder
        },
        {
          headers: this.headers
        }
      );

      if (response.data && response.data.test_cases) {
        const testCases = response.data.test_cases;
        // Chuyển đổi định dạng
        return testCases.map((testCase, index) => {
          return {
            params: this.parseTestCaseInput(testCase, response.data.expected_output[index]),
            expected: JSON.stringify(response.data.expected_output[index]),
            explanation: ""
          };
        });
      }

      // Thử phương thức thứ 2: Lấy từ playground API
      const playgroundResponse = await axios.get(
        `https://leetcode.com/playground/api/problems/${titleSlug}/testcases/`,
        { headers: this.headers }
      );

      if (playgroundResponse.data && playgroundResponse.data.testcases) {
        return playgroundResponse.data.testcases.map(tc => ({
          params: this.parseTestCaseInput(tc.input, tc.output),
          expected: JSON.stringify(tc.output),
          explanation: tc.explanation || ""
        }));
      }

      return [];
    } catch (error) {
      this.logger.error(`❌ Failed to fetch detailed test cases for ${titleSlug}`, error.stack);
      return [];
    }
  }

  parseTestCaseInput(input: string, expectedOutput: string): any[] {
    try {
      // Phân tách input thành các tham số riêng biệt nếu có thể
      const lines = input.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        return [{
          name: 'input',
          type: 'string',
          value: JSON.stringify(input)
        }];
      }

      // Thử phân tích input dựa trên định dạng
      if (input.includes('=')) {
        // Nếu input có định dạng params (n = 3, edges = [[0,1,1]], etc.)
        const params: any[] = [];
        const paramPairs = input.split(',').map(s => s.trim());

        for (const pair of paramPairs) {
          // Match format: param = value
          const match = pair.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
          if (match) {
            const [_, paramName, rawValue] = match;
            const trimmedValue = rawValue.trim();

            // Xác định kiểu dữ liệu
            let type = 'string';
            let value: any = trimmedValue;

            // Phân tích kiểu dữ liệu
            if (/^".*"$/.test(trimmedValue) || /^'.*'$/.test(trimmedValue)) {
              // String trong dấu ngoặc kép hoặc đơn
              type = 'string';
              value = trimmedValue.slice(1, -1); // Bỏ dấu ngoặc
            } else if (/^\[.*\]$/.test(trimmedValue)) {
              // Array
              try {
                const arrayStr = trimmedValue.replace(/'/g, '"');
                value = JSON.parse(arrayStr);
                type = 'array';
              } catch {
                type = 'string';
              }
            } else if (/^-?\d+$/.test(trimmedValue)) {
              // Integer
              type = 'int';
              value = parseInt(trimmedValue, 10);
            } else if (/^-?\d+\.\d+$/.test(trimmedValue)) {
              // Float
              type = 'float';
              value = parseFloat(trimmedValue);
            } else if (/^true|false$/i.test(trimmedValue)) {
              // Boolean
              type = 'boolean';
              value = trimmedValue.toLowerCase() === 'true';
            }

            params.push({
              name: paramName,
              type: type,
              value: JSON.stringify(value)
            });
          }
        }

        if (params.length > 0) {
          return params;
        }
      }

      // Fallback: Thử phân tích từng dòng như là các tham số riêng biệt
      return lines.map((line, index) => {
        try {
          // Thử parse thành JSON
          const parsed = JSON.parse(line.replace(/'/g, '"'));
          return {
            name: `param${index + 1}`,
            type: Array.isArray(parsed) ? 'array' : typeof parsed,
            value: JSON.stringify(parsed)
          };
        } catch {
          // Nếu không phải JSON, giữ nguyên chuỗi
          return {
            name: `param${index + 1}`,
            type: 'string',
            value: JSON.stringify(line)
          };
        }
      });
    } catch (error) {
      this.logger.error('❌ Failed to parse test case input', error.stack);
      return [{
        name: 'input',
        type: 'string',
        value: JSON.stringify(input)
      }];
    }
  }

  parseTestCasesFromApi(exampleTestcases: string, metaData: any): any[] {
    try {
      // Với bài không phải SQL, phân tích test cases từ exampleTestcases
      const testCases = exampleTestcases.split('\n');
      const params = metaData.params || [];

      return testCases.map(testCase => {
        // Phân tách input và expected output
        const inputs = testCase.split('\n');

        // Xử lý params dựa vào metadata
        const parsedParams = [];

        if (params.length > 0) {
          // Có metadata về params
          inputs.forEach((input, index) => {
            if (index < params.length) {
              const param = params[index];
              parsedParams.push({
                name: param.name,
                type: param.type,
                value: JSON.stringify(this.parseValueByParamType(input, param.type))
              });
            }
          });
        } else {
          // Không có metadata, lưu nguyên input
          parsedParams.push({
            name: 'input',
            type: 'string',
            value: JSON.stringify(testCase)
          });
        }

        return {
          params: parsedParams,
          expected: JSON.stringify(""), // Không có expected rõ ràng từ exampleTestcases
          explanation: ""
        };
      });
    } catch (error) {
      this.logger.error('❌ Failed to parse test cases from API', error.stack);
      return [];
    }
  }

  // Phương thức để phân tích giá trị dựa trên kiểu tham số
  parseValueByParamType(rawValue: string, type: string): any {
    try {
      switch (type.toLowerCase()) {
        case 'integer':
        case 'int':
          return parseInt(rawValue.trim(), 10);

        case 'string':
          return rawValue.trim();

        case 'double':
        case 'float':
          return parseFloat(rawValue.trim());

        case 'boolean':
          return rawValue.trim().toLowerCase() === 'true';

        case 'integer[]':
        case 'int[]':
        case 'array':
        case 'list':
          try {
            return JSON.parse(rawValue.trim().replace(/'/g, '"'));
          } catch {
            return rawValue.trim();
          }

        default:
          return rawValue.trim();
      }
    } catch (error) {
      return rawValue;
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

          // Xử lý output - LẤY TRỰC TIẾP GIÁ TRỊ SAU OUTPUT
          const outputContent = outputMatch[1] || outputMatch[2] || '';
          let expected = this.cleanHtml(outputContent);

          // Thử convert expected thành định dạng phù hợp
          try {
            // Xem output là gì (số, chuỗi, mảng, ...)
            if (/^-?\d+$/.test(expected)) {
              // Nếu là số nguyên
              expected = JSON.stringify(parseInt(expected, 10));
            } else if (/^-?\d+\.\d+$/.test(expected)) {
              // Nếu là số thực
              expected = JSON.stringify(parseFloat(expected));
            } else if (/^\[.*\]$/.test(expected)) {
              // Nếu là mảng
              expected = JSON.stringify(JSON.parse(expected.replace(/'/g, '"')));
            } else if (/^true|false$/i.test(expected)) {
              // Nếu là boolean
              expected = JSON.stringify(expected.toLowerCase() === 'true');
            } else {
              // Mặc định là string
              expected = JSON.stringify(expected);
            }
          } catch (e) {
            // Nếu parse lỗi, giữ nguyên chuỗi và đưa vào JSON
            expected = JSON.stringify(expected);
          }

          // Parse params từ input string
          const params: any[] = [];

          // Phân tích các tham số từ input string (n = 3, edges = [[0,1,1],[1,2,2]], k = 2, t = 4)
          const paramPairs = inputStr.split(',').map(s => s.trim());

          for (const pair of paramPairs) {
            // Match format: param = value
            const match = pair.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
            if (match) {
              const [_, paramName, rawValue] = match;
              const trimmedValue = rawValue.trim();

              // Xác định kiểu dữ liệu
              let type = 'string';
              let value: any = trimmedValue;

              // Phân tích kiểu dữ liệu
              if (/^".*"$/.test(trimmedValue) || /^'.*'$/.test(trimmedValue)) {
                // String trong dấu ngoặc kép hoặc đơn
                type = 'string';
                value = trimmedValue.slice(1, -1); // Bỏ dấu ngoặc
              } else if (/^\[.*\]$/.test(trimmedValue)) {
                // Array
                try {
                  const arrayStr = trimmedValue.replace(/'/g, '"');
                  value = JSON.parse(arrayStr);
                  type = 'array';
                } catch {
                  type = 'string';
                }
              } else if (/^-?\d+$/.test(trimmedValue)) {
                // Integer
                type = 'int';
                value = parseInt(trimmedValue, 10);
              } else if (/^-?\d+\.\d+$/.test(trimmedValue)) {
                // Float
                type = 'float';
                value = parseFloat(trimmedValue);
              } else if (/^true|false$/i.test(trimmedValue)) {
                // Boolean
                type = 'boolean';
                value = trimmedValue.toLowerCase() === 'true';
              }

              params.push({
                name: paramName,
                type: type,
                value: JSON.stringify(value)
              });
            }
          }

          let explanation = "";
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

  cleanHtml(html: string): string {
    // Loại bỏ các thẻ HTML và chuẩn hóa khoảng trắng
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")  // Thêm xử lý cho dấu nháy đơn
      .trim();
  }

  parseSqlTestCases(content: string, metaData: any): any[] {
    const testcases: any[] = [];
    try {
      if (!content) {
        return [];
      }

      // Trích xuất định nghĩa bảng và dữ liệu bảng
      const tableDefinitions = this.extractTableDefinitions(content);
      const tableExamples = this.extractTableExamples(content);

      // Trích xuất output mong đợi
      const expectedOutputTable = this.extractExpectedOutput(content);

      // Lấy mô tả từ nội dung
      const description = this.extractSqlDescription(content);

      // Tạo test case cho bài SQL
      if (tableDefinitions.length > 0 || tableExamples.length > 0) {
        testcases.push({
          params: [
            {
              name: "tables",
              type: "object",
              value: JSON.stringify({
                definitions: tableDefinitions,
                examples: tableExamples
              })
            },
            {
              name: "description",
              type: "string",
              value: JSON.stringify(description)
            }
          ],
          expected: JSON.stringify(expectedOutputTable),
          explanation: this.extractExplanation(content)
        });
      }

      return testcases;
    } catch (error) {
      this.logger.error('❌ Failed to parse SQL test cases', error.stack);
      return [];
    }
  }

  extractTableDefinitions(content: string): any[] {
    const tables = [];
    try {
      // Regex để bắt các định nghĩa bảng
      const tableRegex = /Table:\s*([A-Za-z0-9_]+)\s*\n+\s*\+[-+]+\+[-+]+\+\s*\n\s*\|\s*Column Name\s*\|\s*Type\s*\|\s*\n\s*\+[-+]+\+[-+]+\+\s*([\s\S]*?)\n\s*\+[-+]+\+[-+]+\+/g;

      let tableMatch;
      while ((tableMatch = tableRegex.exec(content)) !== null) {
        const tableName = tableMatch[1].trim();
        const columnsText = tableMatch[2];

        // Tách các dòng cột
        const columnLines = columnsText.split('\n').filter(line => line.trim().includes('|'));
        const columns = columnLines.map(line => {
          const parts = line.split('|').map(part => part.trim()).filter(Boolean);
          if (parts.length >= 2) {
            return {
              name: parts[0],
              type: parts[1]
            };
          }
          return null;
        }).filter(Boolean);

        // Tìm các ràng buộc cho bảng (primary key, unique, etc.)
        const constraintRegex = new RegExp(`\\(([^)]+)\\)\\s+is\\s+the\\s+unique\\s+identifier\\s+for\\s+${tableName}`, 'i');
        const constraintMatch = content.match(constraintRegex);
        let primaryKey = null;
        if (constraintMatch && constraintMatch[1]) {
          primaryKey = constraintMatch[1].split(',').map(k => k.trim());
        }

        tables.push({
          name: tableName,
          columns,
          primaryKey
        });
      }
    } catch (error) {
      this.logger.error('❌ Failed to extract table definitions', error.stack);
    }
    return tables;
  }

  extractTableExamples(content: string): any[] {
    const examples = [];
    try {
      // Regex để bắt dữ liệu bảng ví dụ
      const exampleTableRegex = /([A-Za-z0-9_]+)\s+table:\s*\n+\s*\+-+\+-+\+(?:-+\+)*\s*\n\s*\|\s*(.*?)\s*\|\s*\n\s*\+-+\+-+\+(?:-+\+)*\s*([\s\S]*?)\n\s*\+-+\+-+\+(?:-+\+)*/g;

      let exampleMatch;
      while ((exampleMatch = exampleTableRegex.exec(content)) !== null) {
        const tableName = exampleMatch[1].trim();
        const headerLine = exampleMatch[2].trim();
        const dataLines = exampleMatch[3];

        // Tách header
        const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);

        // Tách dữ liệu
        const rows = [];
        const lines = dataLines.split('\n').filter(line => line.includes('|'));
        for (const line of lines) {
          const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
          if (cells.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
              row[header] = cells[index];
            });
            rows.push(row);
          }
        }

        examples.push({
          name: tableName,
          headers,
          rows
        });
      }
    } catch (error) {
      this.logger.error('❌ Failed to extract table examples', error.stack);
    }
    return examples;
  }

  extractExpectedOutput(content: string): any {
    try {
      // Regex để bắt bảng output
      const outputRegex = /Output:\s*\n+\s*\+-+\+-+\+(?:-+\+)*\s*\n\s*\|\s*(.*?)\s*\|\s*\n\s*\+-+\+-+\+(?:-+\+)*\s*([\s\S]*?)\n\s*\+-+\+-+\+(?:-+\+)*/;

      const outputMatch = content.match(outputRegex);
      if (outputMatch) {
        const headerLine = outputMatch[1].trim();
        const dataLines = outputMatch[2];

        // Tách header
        const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);

        // Tách dữ liệu
        const rows = [];
        const lines = dataLines.split('\n').filter(line => line.includes('|'));
        for (const line of lines) {
          const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
          if (cells.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
              row[header] = cells[index];
            });
            rows.push(row);
          }
        }

        return {
          headers,
          rows
        };
      }
    } catch (error) {
      this.logger.error('❌ Failed to extract expected output', error.stack);
    }
    return null;
  }

  extractSqlDescription(content: string): string {
    try {
      // Cố gắng trích xuất mô tả từ nội dung
      // Thường nằm giữa định nghĩa bảng và ví dụ đầu vào
      const descRegex = /Each row assigns a category and price to a product\.\s*\n\s*([\s\S]*?)\n\s*Example:/;
      const descMatch = content.match(descRegex);
      if (descMatch && descMatch[1]) {
        return this.cleanHtml(descMatch[1]).trim();
      }

      // Phương án dự phòng - lấy nội dung giữa định nghĩa bảng cuối cùng và ví dụ
      const fallbackRegex = /\+-+\+-+\+\s*\n([\s\S]*?)Example:/;
      const fallbackMatch = content.match(fallbackRegex);
      if (fallbackMatch && fallbackMatch[1]) {
        return this.cleanHtml(fallbackMatch[1]).trim();
      }
    } catch (error) {
      this.logger.error('❌ Failed to extract SQL description', error.stack);
    }
    return "";
  }

  extractExplanation(content: string): string {
    try {
      // Trích xuất phần giải thích từ sau output
      const explRegex = /Explanation:\s*\n\s*([\s\S]*?)(?:\n\s*\n|\n\s*Constraints:|\n\s*$)/;
      const explMatch = content.match(explRegex);
      if (explMatch && explMatch[1]) {
        return this.cleanHtml(explMatch[1]).trim();
      }
    } catch (error) {
      this.logger.error('❌ Failed to extract explanation', error.stack);
    }
    return "";
  }
}
