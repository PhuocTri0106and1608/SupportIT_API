import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";
import { TestSetRepository } from "../repositories";
import { RedisService } from "@modules/redis";
import { Types } from "mongoose";
import { LeetCodeProblemRepository } from '../../leetcode/repositories/leetcode-problem.repository';
import { TestSet } from "../schemas";
import { QuizRepository } from "@modules/quizz/repositories";
import { JDRepository } from "@modules/cv/repositories";
import { plainToClass } from "class-transformer";
import { LeetCodeProblemResponseDto } from "@modules/leetcode/dtos";
import { TestSetResponseDto, UpdateTestSetDto } from "../dtos";
import { QuizResponseDto } from "@modules/quizz/dtos";

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
    quizIds: string[], problemIds: string[], jdId: string, duration?: number}
  ): Promise<ResponseType> {
    const { creatorUserId, quizIds, problemIds, jdId, duration } = request;
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
        quizIds,
        problemIds,
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
        throw new HttpException("TestSet not found for the given JD", HttpStatus.NOT_FOUND);
      }

      const [quizzes, problems] = await Promise.all([
        this.quizRepository.find(
          { _id: { $in: testSet.quizIds } }
        ),
        this.problemRepository.find({ _id: { $in: testSet.problemIds } }),
      ]);

      const transformedQuizzes = quizzes.map(problem =>
        plainToClass(QuizResponseDto, problem.toObject(), {
          excludeExtraneousValues: true
        })
      );

      const transformedProblems = problems.map(problem =>
        plainToClass(LeetCodeProblemResponseDto, problem.toObject(), {
          excludeExtraneousValues: true
        })
      );

      const fullTestSet = {
        creatorUserId: testSet.creatorUserId,
        jdId: testSet.jdId,
        duration: testSet.duration,
        quizzes: transformedQuizzes,
        problems: transformedProblems,
      };

      const resultData = plainToClass(TestSetResponseDto, fullTestSet, {
        excludeExtraneousValues: true,
      });


      await this.redisService.set(cacheKey, resultData, { ttl: 60 * 60 });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: resultData,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException("getTestSetByJD error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }
  async updateTestSetByJD(request: UpdateTestSetDto): Promise<ResponseType> {
    const { jdId, ...updateData } = request;
    try {
      const cacheKey = `testSet:${jdId}`;

      const testSet: TestSet = await this.testSetRepository.findOneAndUpdate({ jdId }, updateData);
      if (!testSet) {
        throw new HttpException("TestSet not found for the given JD", HttpStatus.NOT_FOUND);
      }

      const [quizzes, problems] = await Promise.all([
        this.quizRepository.find(
          { _id: { $in: testSet.quizIds } }
        ),
        this.problemRepository.find({ _id: { $in: testSet.problemIds } }),
      ]);

      const transformedQuizzes = quizzes.map(problem =>
        plainToClass(QuizResponseDto, problem.toObject(), {
          excludeExtraneousValues: true
        })
      );

      const transformedProblems = problems.map(problem =>
        plainToClass(LeetCodeProblemResponseDto, problem.toObject(), {
          excludeExtraneousValues: true
        })
      );

      const fullTestSet = {
        creatorUserId: testSet.creatorUserId,
        jdId: testSet.jdId,
        duration: testSet.duration,
        quizzes: transformedQuizzes,
        problems: transformedProblems,
      };

      const resultData = plainToClass(TestSetResponseDto, fullTestSet, {
        excludeExtraneousValues: true,
      });


      await this.redisService.set(cacheKey, resultData, { ttl: 60 * 60 });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: resultData,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException("updateTestSetByJD error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }
}
