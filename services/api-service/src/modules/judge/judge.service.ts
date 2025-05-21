import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { ResponseType } from '@common/dtos';
import { CodeResponseEnum } from '@common/enums';
import { LeetCodeService } from '@modules/leetcode/leetcode.service';
import { SubmissionResultRepository } from './repositories';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '@environments';

// Đọc file JSON ngôn ngữ được hỗ trợ
const languageCodesFilePath = path.join(__dirname, 'newdatabase.languagecodes.json');
let languageCodes = [];

try {
  const fileContent = fs.readFileSync(languageCodesFilePath, 'utf8');
  languageCodes = JSON.parse(fileContent);
} catch (error) {
  // Fallback languages nếu không đọc được file
  languageCodes = [
    { code: 63, name: "JavaScript (Node.js 12.14.0)" },
    { code: 71, name: "Python (3.8.1)" },
    { code: 62, name: "Java (OpenJDK 13.0.1)" },
    { code: 54, name: "C++ (GCC 9.2.0)" }
  ];
}

@Injectable()
export class JudgeService {
  private readonly logger = new Logger(JudgeService.name);
  private readonly rapidApiKey: string;
  private readonly judgeApiUrl: string = 'https://judge0-ce.p.rapidapi.com';

  constructor(
    private readonly leetCodeService: LeetCodeService,
    private readonly submissionResultRepository: SubmissionResultRepository,
  ) {
    this.rapidApiKey = env.judge0Api.RAPID_API_KEY || '';
  }

  async submitCode(userId: string, sourceCode: string, languageId: number, problemId: string): Promise<ResponseType> {
    try {
      // Get problem from database
      const problemResponse = await this.leetCodeService.getProblemById(parseInt(problemId, 10));
      const problem = problemResponse.data;

      if (!problem) {
        throw new BadRequestException(`Problem with ID ${problemId} not found`);
      }

      // Generate wrapper code based on the language
      const wrappedCode = await this.generateWrapperCode(languageId, sourceCode, problem);

      // Evaluate each test case
      const testResults = [];
      for (const testCase of problem.testcases) {
        const result = await this.evaluateTestCase(wrappedCode, languageId, testCase);
        testResults.push(result);
      }

      // Calculate overall results
      const passedTests = testResults.filter(result => result.status.id === 3).length;
      const totalTests = testResults.length;
      const success = passedTests === totalTests;

      // Save results to database if user is provided
      if (userId) {
        try {
          const language = await this.getLanguageNameById(languageId);
          await this.submissionResultRepository.create({
            userId,
            problemId,
            languageId,
            languageName: language,
            sourceCode,
            success,
            passedTests,
            totalTests,
            testResults
          });
        } catch (error) {
          this.logger.error(`Error saving submission result: ${error.message}`, error.stack);
        }
      }

      // Return response
      return {
        code: CodeResponseEnum.SUCCESS,
        data: {
          success,
          passedTests,
          totalTests,
          testResults
        }
      };
    } catch (error) {
      this.logger.error(`Error submitting code: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to submit code for evaluation');
    }
  }

  private async evaluateTestCase(sourceCode: string, languageId: number, testCase: any): Promise<any> {
    try {
      const { stdin, expectedOutput } = this.prepareTestCaseIO(testCase);

      const response = await axios.post(
        `${this.judgeApiUrl}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: sourceCode,
          language_id: languageId,
          stdin,
          expected_output: expectedOutput
        },
        {
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const submissionResult = response.data;

      return {
        testCase,
        status: {
          id: submissionResult.status.id,
          description: submissionResult.status.description
        },
        stdout: submissionResult.stdout || '',
        stderr: submissionResult.stderr || '',
        compile_output: submissionResult.compile_output || '',
        time: submissionResult.time,
        memory: submissionResult.memory,
        message: submissionResult.message || '',
        passed: submissionResult.status.id === 3  // 3 = Accepted
      };
    } catch (error) {
      this.logger.error(`Error evaluating test case: ${error.message}`);
      return {
        testCase,
        status: {
          id: -1,
          description: 'Evaluation Error'
        },
        stderr: error.message,
        passed: false,
        error: true
      };
    }
  }

  private prepareTestCaseIO(testCase: any): { stdin: string, expectedOutput: string } {
    try {
      const params = testCase.params || [];

      const stdin = params.map(param => {
        try {
          return JSON.parse(param.value);
        } catch {
          return param.value;
        }
      }).join('\n');

      let expectedOutput = '';
      try {
        expectedOutput = JSON.parse(testCase.expected);
      } catch {
        expectedOutput = testCase.expected;
      }

      return { stdin, expectedOutput };
    } catch (error) {
      this.logger.error(`Error preparing test case: ${error.message}`);
      return { stdin: '', expectedOutput: '' };
    }
  }

  async getSupportedLanguages(): Promise<ResponseType> {
    try {
      // Lấy danh sách ngôn ngữ từ file JSON đã đọc
      const languages = this.getLanguagesFromJsonFile();

      return {
        code: CodeResponseEnum.SUCCESS,
        data: languages
      };
    } catch (error) {
      this.logger.error(`Error getting supported languages: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve supported languages');
    }
  }

  private getLanguagesFromJsonFile(): any[] {
    // Chuyển đổi định dạng từ file JSON sang định dạng API
    return languageCodes.map(lang => ({
      id: lang.code,
      name: lang.name
    }));
  }

  async getSubmissions(userId?: string, problemId?: string): Promise<ResponseType> {
    try {
      let submissions = [];

      if (userId && problemId) {
        submissions = await this.submissionResultRepository.findByUserAndProblem(userId, problemId);
      } else if (userId) {
        submissions = await this.submissionResultRepository.findByUserId(userId);
      } else if (problemId) {
        submissions = await this.submissionResultRepository.findByProblemId(problemId);
      } else {
        throw new BadRequestException('userId or problemId parameter is required');
      }

      return {
        code: CodeResponseEnum.SUCCESS,
        data: submissions
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error retrieving submissions: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve submissions');
    }
  }

  async getSubmissionById(id: string): Promise<ResponseType> {
    try {
      const submission = await this.submissionResultRepository.findById(id);
      if (!submission) {
        throw new BadRequestException(`Submission with ID ${id} not found`);
      }

      return {
        code: CodeResponseEnum.SUCCESS,
        data: submission
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error retrieving submission: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve submission details');
    }
  }

  async generateWrapperCode(languageId: number, userCode: string, problem: any): Promise<string> {
    // Generate wrapper code based on language ID

    // JavaScript
    if ([63, 93, 97, 102].includes(languageId)) {
      return this.generateJavaScriptWrapper(userCode, problem);
    }

    // Python
    if ([70, 71, 92, 100, 109].includes(languageId)) {
      return this.generatePythonWrapper(userCode, problem);
    }

    // Java
    if ([62, 91, 96].includes(languageId)) {
      return this.generateJavaWrapper(userCode, problem);
    }

    // C++
    if ([52, 53, 54, 76, 105].includes(languageId)) {
      return this.generateCppWrapper(userCode, problem);
    }

    // C
    if ([48, 49, 50, 75, 103, 104, 110].includes(languageId)) {
      return this.generateCWrapper(userCode, problem);
    }

    // C#
    if ([51].includes(languageId)) {
      return this.generateCSharpWrapper(userCode, problem);
    }

    // TypeScript
    if ([74, 94, 101].includes(languageId)) {
      return this.generateTypeScriptWrapper(userCode, problem);
    }

    // Rust
    if ([73, 108].includes(languageId)) {
      return this.generateRustWrapper(userCode, problem);
    }

    // Go
    if ([60, 95, 106, 107].includes(languageId)) {
      return this.generateGoWrapper(userCode, problem);
    }

    // Ruby
    if ([72].includes(languageId)) {
      return this.generateRubyWrapper(userCode, problem);
    }

    // PHP
    if ([68, 98].includes(languageId)) {
      return this.generatePhpWrapper(userCode, problem);
    }

    // SQL
    if ([82].includes(languageId)) {
      return this.generateSqlWrapper(userCode, problem);
    }

    // Không có wrapper đặc biệt cho ngôn ngữ này
    return userCode;
  }

  private async getLanguageNameById(languageId: number): Promise<string> {
    const languagesResponse = await this.getSupportedLanguages();
    const languages = languagesResponse.data;
    const language = languages.find(lang => lang.id === languageId);
    return language ? language.name : 'Unknown Language';
  }

  private generateJavaScriptWrapper(userCode: string, problem: any): string {
    // Get first test case to determine structure
    const testCase = problem.testcases && problem.testcases.length > 0 ? problem.testcases[0] : null;
    if (!testCase) return userCode;

    // Identify function name from code snippets
    const jsSnippet = problem.codeSnippets.find(snippet => snippet.language === 'JavaScript');
    if (!jsSnippet) return userCode;

    // Extract function name
    const functionNameMatch = jsSnippet.code.match(/var\s+(\w+)\s*=\s*function|function\s+(\w+)\s*\(/);
    const functionName = functionNameMatch ? (functionNameMatch[1] || functionNameMatch[2]) : null;

    if (!functionName) return userCode;

    // Create wrapper
    return `
${userCode}

// Test code
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const lines = [];
rl.on('line', (line) => {
  lines.push(line);
});

rl.on('close', () => {
  // Parse input
  ${this.generateJSParamsParser(testCase.params)}
  
  // Call the function
  const result = ${functionName}(${testCase.params.map(p => p.name).join(', ')});
  
  // Output the result
  console.log(JSON.stringify(result));
});
`;
  }

  private generateJSParamsParser(params: any[]): string {
    return params.map((param, index) => {
      const varName = param.name;
      return `const ${varName} = JSON.parse(lines[${index}]);`;
    }).join('\n  ');
  }

  private generatePythonWrapper(userCode: string, problem: any): string {
    const testCase = problem.testcases && problem.testcases.length > 0 ? problem.testcases[0] : null;
    if (!testCase) return userCode;

    // Identify function/class name from code snippets
    const pySnippet = problem.codeSnippets.find(snippet => snippet.language === 'Python' || snippet.language === 'Python3');
    if (!pySnippet) return userCode;

    // Extract class or function name
    let className = null;
    let methodName = null;

    // Check if it's a class-based problem
    const classMatch = pySnippet.code.match(/class\s+(\w+)/);
    if (classMatch) {
      className = classMatch[1];
      const methodMatch = pySnippet.code.match(/def\s+(\w+)\s*\(/);
      methodName = methodMatch ? methodMatch[1] : null;
    } else {
      // Function-based problem
      const funcMatch = pySnippet.code.match(/def\s+(\w+)\s*\(/);
      methodName = funcMatch ? funcMatch[1] : null;
    }

    if (!methodName) return userCode;

    // Create wrapper
    return `
${userCode}

# Test code
import sys
import json

lines = []
for line in sys.stdin:
    lines.append(line.strip())

# Parse input
${this.generatePythonParamsParser(testCase.params)}

# Call the function
${className ? `solution = ${className}()
result = solution.${methodName}(${testCase.params.map(p => p.name).join(', ')})` :
        `result = ${methodName}(${testCase.params.map(p => p.name).join(', ')})`}

# Output the result
print(json.dumps(result))
`;
  }

  private generatePythonParamsParser(params: any[]): string {
    return params.map((param, index) => {
      const varName = param.name;
      return `${varName} = json.loads(lines[${index}])`;
    }).join('\n');
  }

  private generateJavaWrapper(userCode: string, problem: any): string {
    // Java wrapper implementation would go here
    // More complex due to Java syntax, needs proper implementation
    return userCode;
  }

  private generateCppWrapper(userCode: string, problem: any): string {
    // C++ wrapper implementation would go here
    return userCode;
  }

  private generateCWrapper(userCode: string, problem: any): string {
    // C wrapper implementation
    return userCode;
  }

  private generateCSharpWrapper(userCode: string, problem: any): string {
    // C# wrapper implementation
    return userCode;
  }

  private generateTypeScriptWrapper(userCode: string, problem: any): string {
    // TypeScript wrapper implementation similar to JavaScript
    return this.generateJavaScriptWrapper(userCode, problem);
  }

  private generateRustWrapper(userCode: string, problem: any): string {
    // Rust wrapper implementation
    return userCode;
  }

  private generateGoWrapper(userCode: string, problem: any): string {
    // Go wrapper implementation
    return userCode;
  }

  private generateRubyWrapper(userCode: string, problem: any): string {
    // Ruby wrapper implementation
    return userCode;
  }

  private generatePhpWrapper(userCode: string, problem: any): string {
    // PHP wrapper implementation
    return userCode;
  }

  private generateSqlWrapper(userCode: string, problem: any): string {
    // SQL wrapper implementation
    return userCode;
  }
} 