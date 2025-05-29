import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";
import { TestSetRepository } from "./repositories";
import { RedisService } from "@modules/redis";
import { Types } from "mongoose";
import { LeetCodeProblemRepository } from '../leetcode/repositories/leetcode-problem.repository';
import { TestSet } from "./schemas";
import { QuizRepository } from "@modules/quizz/repositories";
import { JDRepository } from "@modules/cv/repositories";

@Injectable()
export class TestSetService {

  constructor(
    private readonly testSetRepository: TestSetRepository,
    private readonly quizRepository: QuizRepository,
    private readonly jdRepository: JDRepository,
    private readonly problemRepository: LeetCodeProblemRepository,
    private readonly redisService: RedisService,
  ) { }

  async linkTestSet(
    request: {creatorUserId: string,
    quizId: string, problemId: string, jdId: string, duration?: number}
  ): Promise<ResponseType> {
    const { creatorUserId, quizId, problemId, jdId, duration } = request;
    try {
      const [existingTestSet, jd] = await Promise.all([
        this.testSetRepository.findOne({ jdId }),
        this.jdRepository.findById(jdId)
      ]);
      if (existingTestSet) {
        throw new HttpException("Test set already exists for this JD", HttpStatus.BAD_REQUEST);
      }
      if (!jd || jd.creatorUserId.toString() !== creatorUserId) {
        throw new HttpException("JD not found or you do not have permission to link this jd", HttpStatus.BAD_REQUEST);
      }

      const newTestSet = await this.testSetRepository.create({
        creatorUserId,
        quizId,
        problemId,
        jdId,
        duration: duration ?? 0,
      });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: newTestSet,
      };
    } catch (error) {
      throw new HttpException("linkTestSet error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async getTestSetByJD(jdId: string): Promise<ResponseType> {
    try {
      const cacheKey = `testSet:${jdId}`;
      const cached = await this.redisService.get<any>(cacheKey);

      if (cached) {
        return {
          code: CodeResponseEnum.SUCCESS,
          data: cached,
        };
      }
      const testSet: TestSet = await this.testSetRepository.findOne({ jdId });
      if (!testSet) {
        throw new HttpException("Quiz not found", HttpStatus.NOT_FOUND);
      }
      const [quiz, problem] = await Promise.all([
        this.quizRepository.findById(testSet.quizId),
        this.problemRepository.findById(testSet.problemId)
      ]);
      const fullTestSet = {
        creatorUserId: testSet.creatorUserId,
        jdId: testSet.jdId,
        duration: testSet.duration,
        quiz,
        problem,
      }

      await this.redisService.set(cacheKey, fullTestSet, { ttl: 60 * 60 });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: fullTestSet,
      };
    } catch (error) {
      throw new HttpException("getTestSetByJD error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }
}
