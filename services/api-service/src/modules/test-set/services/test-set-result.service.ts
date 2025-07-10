import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";
import { TestSetRepository, TestSetResultRepository } from "../repositories";
import { RedisService } from "@modules/redis";
import { Types } from "mongoose";
import { TestSetResult } from "../schemas";
import { SubmitQuizDto } from "@modules/quizz/dtos";
import { QuizService } from "@modules/quizz/quiz.service";
import { SubmitCodeDto } from "@modules/judge/dto";
import { JudgeService } from "@modules/judge/judge.service";
import { ApplicationRepository } from "@modules/cv/repositories";
import { UserRepository } from "@modules/user";

@Injectable()
export class TestSetResultService {

  constructor(
    private readonly testSetResultRepository: TestSetResultRepository,
    private readonly testSetRepository: TestSetRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly userRepository: UserRepository,
    private readonly quizService: QuizService,
    private readonly judgeService: JudgeService,
    private readonly redisService: RedisService,
  ) { }

  async startTestSet(
    request: {candidateId: string,
    testSetId: string}
  ): Promise<ResponseType> {
    const { candidateId, testSetId } = request;
    try {
      const newTestSetResult = await this.testSetResultRepository.create({
        candidateId,
        testSetId
      });
      
      const cacheKey = `testSetResult:${newTestSetResult._id.toString()}`;
      await this.redisService.set(cacheKey, newTestSetResult, { ttl: 60 * 60 });
      return {
        code: CodeResponseEnum.SUCCESS,
        data: newTestSetResult,
      };
    } catch (error) {
      throw new HttpException("startTestSet error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async submitQuizTestSet(
    request: {
      testSetResultId: string,
      quizId: string,
      candidateId: string,
      submitData: SubmitQuizDto
    }
  ): Promise<ResponseType> {
    const { testSetResultId, quizId, candidateId, submitData } = request;
    try {
      const quizResult = await this.quizService.submit(quizId, candidateId, submitData);
      if (quizResult.code !== CodeResponseEnum.SUCCESS) {
        throw new HttpException("Quiz submission failed", HttpStatus.BAD_REQUEST);
      }
      const { score } = quizResult.data;
      const testSetResult = await this.testSetResultRepository.findOneAndUpdate({ _id: new Types.ObjectId(testSetResultId) }, {
        $push: {
          completedQuizIds: quizId,
        },
        $inc: {
          totalQuizScore: score,
        },
      });

      const cacheKey = `testSetResult:${testSetResultId}`;
      await this.redisService.set(cacheKey, testSetResult, { ttl: 60 * 60 });
      return {
        code: CodeResponseEnum.SUCCESS,
        data: testSetResult,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async submitProblemTestSet(
    request: {
      testSetResultId: string,
      candidateId: string,
      submitData: SubmitCodeDto
    }
  ): Promise<ResponseType> {
    const { testSetResultId, candidateId, submitData } = request;
    try {
      const problemResult = await this.judgeService.submitCode(candidateId, submitData.sourceCode, submitData.languageId, submitData.problemId);
      if (problemResult.code !== CodeResponseEnum.SUCCESS) {
        throw new HttpException("Code submission failed", HttpStatus.BAD_REQUEST);
      }
      const { problemId, success } = problemResult.data;
      const testSetResult = await this.testSetResultRepository.findOneAndUpdate({ _id: new Types.ObjectId(testSetResultId) }, {
        $push: {
          completedProblemIds: problemId,
        },
        $inc: {
          totalPassedCodingProblems: success ? 1 : 0,
          totalCodingProblems: 1,
        },
      });

      const cacheKey = `testSetResult:${testSetResultId}`;
      await this.redisService.set(cacheKey, testSetResult, { ttl: 60 * 60 });
      return {
        code: CodeResponseEnum.SUCCESS,
        data: testSetResult,
      };
    } catch (error) {
      throw new HttpException("submitProblemTestSet error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async submitFinalTestSet(id: string): Promise<ResponseType> {
    try {
      const cacheKey = `testSetResult:${id}`;
      let testSetResult: TestSetResult = await this.redisService.get<any>(cacheKey);

      if (!testSetResult) {
        testSetResult = await this.testSetResultRepository.findById(id);
      }

      if (!testSetResult) {
        throw new HttpException("TestSetResult not found", HttpStatus.NOT_FOUND);
      }
      console.log({ testSetResult})
      const quizScore = (testSetResult.totalQuizScore / testSetResult.completedQuizIds.length) || 0;
      const codingScore = (testSetResult.totalPassedCodingProblems / testSetResult.totalCodingProblems) || 0;
      const finalScore = (quizScore + codingScore) / 2;

      const endAt: Date = new Date();
      const startedAt: Date = new Date(testSetResult.startedAt)
      const actualDuration = Math.floor((endAt.getTime() - startedAt.getTime()) / 1000);

      testSetResult = await this.testSetResultRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id) },
        {
          finalScore,
          endAt,
          actualDuration,
          submitted: true,
        }
      );

      await this.redisService.set(cacheKey, testSetResult, { ttl: 60 * 60 });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: testSetResult,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException("submitFinalTestSet error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async getTestSetResultById(id: string): Promise<ResponseType> {
    try {
      const cacheKey = `testSetResult:${id}`;
      const cached = await this.redisService.get<any>(cacheKey);

      if (cached) {
        return {
          code: CodeResponseEnum.SUCCESS,
          data: cached,
        };
      }

      const testSetResult: TestSetResult = await this.testSetResultRepository.findById(id);
      await this.redisService.set(cacheKey, testSetResult, { ttl: 60 * 60 });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: testSetResult,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException("getTestSetResultById error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async getTestSetResultsByJdId(jdId: string): Promise<ResponseType> {
    try {
      const applications = await this.applicationRepository.findApplicationByJdId(jdId);
      const candidateIds = applications.map(app => app.candidateId);

      if (!candidateIds.length) {
        return {
          code: CodeResponseEnum.SUCCESS,
          data: [],
        };
      }

      const testSet = await this.testSetRepository.findOne({ jdId });
      if (!testSet) {
        return {
          code: CodeResponseEnum.SUCCESS,
          data: [],
        };
      }

      const testSetResults = await this.testSetResultRepository.findResultsByTestSetIdAndCandidateId(
        testSet._id.toString(),
        candidateIds
      );

      // Lấy cả name và email
      const users = await this.userRepository.findAndCustomSelect(
        { _id: { $in: candidateIds.map(id => new Types.ObjectId(id)) } },
        { name: 1, email: 1 }
      );

      // Map userId -> { name, email }
      const userMap = new Map(users.map((u: any) => [u._id.toString(), { name: u.name, email: u.email }]));

      // Gắn userName và email vào từng kết quả
      const resultsWithUserInfo = testSetResults.map((result: any) => {
        const user = userMap.get(result.candidateId?.toString() || "");
        return {
          ...result.toObject?.() ?? result,
          userName: user?.name || null,
          userEmail: user?.email || null,
        };
      });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: resultsWithUserInfo,
      };
    } catch (error) {
      throw new HttpException(`getTestSetResultsByJdId error: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }
}
