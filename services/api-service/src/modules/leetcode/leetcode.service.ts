import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { LeetCodeProblemRepository } from './repositories';
import { ResponseType } from '@common/dtos';
import { CodeResponseEnum } from '@common/enums';
import { RedisService } from '@modules/redis/redis.service';
import { plainToClass } from 'class-transformer';
import { SuggestedResponse } from '@modules/cv/interfaces';
import { CreateLeetCodeProblemDto, LeetCodeProblemResponseDto, ProblemPaginationResponseDto, UpdateLeetCodeProblemDto } from './dtos';
import { Types } from 'mongoose';

@Injectable()
export class LeetCodeService {
  private readonly CACHE_TTL_SECONDS = 3600;
  private readonly CACHE_KEY_PREFIX = 'leetcode:';

  constructor(
    private readonly leetCodeProblemRepository: LeetCodeProblemRepository,
    private readonly redisService: RedisService,
  ) { }

  async getProblemById(id: string): Promise<ResponseType> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}problem:id:${id}`;
    const cachedProblem = await this.redisService.get(cacheKey);

    if (cachedProblem) {
      return {
        code: CodeResponseEnum.SUCCESS,
        data: cachedProblem,
      };
    }

    const problem = await this.leetCodeProblemRepository.findById(id);
    if (!problem) {
      throw new NotFoundException(`Problem with ID ${id} not found`);
    }

    await this.redisService.set(cacheKey, problem, { ttl: this.CACHE_TTL_SECONDS });

    return {
      code: CodeResponseEnum.SUCCESS,
      data: problem,
    };
  }

  async getProblemBySlug(slug: string): Promise<ResponseType> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}problem:slug:${slug}`;
    const cachedProblem = await this.redisService.get(cacheKey);

    if (cachedProblem) {
      return {
        code: CodeResponseEnum.SUCCESS,
        data: cachedProblem,
      };
    }

    const problem = await this.leetCodeProblemRepository.findByTitleSlug(slug);
    if (!problem) {
      throw new NotFoundException(`Problem with slug ${slug} not found`);
    }

    await this.redisService.set(cacheKey, problem, { ttl: this.CACHE_TTL_SECONDS });

    return {
      code: CodeResponseEnum.SUCCESS,
      data: problem,
    };
  }

  async getAllProblems(
    page: number = 1,
    limit: number = 10,
    difficulty?: string,
    tag?: string,
    creatorUserId?: string
  ): Promise<ResponseType> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (tag) {
      filter.topicTags = { $in: [tag] };
    }

    if (creatorUserId) {
      filter.creatorUserId = creatorUserId;
    } else {
      filter.creatorUserId = { $exists: false }; // Only include problems without a creator
    }

    const [problems, total] = await Promise.all([
      this.leetCodeProblemRepository.findWithPagination(filter, skip, limit),
      this.leetCodeProblemRepository.countDocuments(filter),
    ]);

    const transformedProblems = problems.map(problem => {
      const plainProblem = {
        ...problem,
        _id: problem._id.toString()
      };
      return plainToClass(LeetCodeProblemResponseDto, plainProblem, {
        excludeExtraneousValues: true
      });
    });

    const result = {
      problems: transformedProblems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    const transformedResult = plainToClass(ProblemPaginationResponseDto, result, {
      excludeExtraneousValues: true
    });

    return {
      code: CodeResponseEnum.SUCCESS,
      data: transformedResult,
    };
  }

  async getSuggestedProblems(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ResponseType> {

    try {
      const redisKey = `suggest:userId:${userId}`;
      const suggestedData: SuggestedResponse | null = await this.redisService.get(redisKey);

      let suggestedProblemTags: string[] = [];
      if (suggestedData && suggestedData.suggested_problems) {
        suggestedProblemTags = suggestedData.suggested_problems;
      }

      const filter: any = {};
      if (suggestedProblemTags.length > 0) {
        filter.topicTags = { $in: suggestedProblemTags };
      } else {
        console.log(`No suggested problem tags found for userId: ${userId}`);
        return {
          code: CodeResponseEnum.SUCCESS,
          data: plainToClass(ProblemPaginationResponseDto, { problems: [], pagination: { total: 0, page, limit, totalPages: 0 } }, { excludeExtraneousValues: true }),
        };
      }

      const skip = (page - 1) * limit;
      const [problems, total] = await Promise.all([
        this.leetCodeProblemRepository.findWithPagination(filter, skip, limit),
        this.leetCodeProblemRepository.countDocuments(filter),
      ]);

      const transformedProblems = problems.map(problem => {
        const plainProblem = {
          ...problem,
          _id: problem._id.toString()
        };
        return plainToClass(LeetCodeProblemResponseDto, plainProblem, {
          excludeExtraneousValues: true
        });
      }); 

      const result = {
        problems: transformedProblems,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      const transformedResult = plainToClass(ProblemPaginationResponseDto, result, {
        excludeExtraneousValues: true
      });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: transformedResult,
      };
    } catch (error) {
      console.error(`Error getting suggested problems for userId ${userId}: ${error.message}`);
      throw new HttpException(`getSuggestedProblems error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async getAllTopicTags(): Promise<ResponseType> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}topic:tags`;
    const cachedTags = await this.redisService.get(cacheKey);

    if (cachedTags) {
      return {
        code: CodeResponseEnum.SUCCESS,
        data: cachedTags,
      };
    }

    const problems = await this.leetCodeProblemRepository.find({});
    const tagsSet = new Set<string>();

    problems.forEach((problem) => {
      problem.topicTags.forEach((tag: string) => {
        tagsSet.add(tag);
      });
    });

    const tags = Array.from(tagsSet).sort();

    await this.redisService.set(cacheKey, tags);

    return {
      code: CodeResponseEnum.SUCCESS,
      data: tags,
    };
  }

    async createProblem(creatorUserId: string, problemData: CreateLeetCodeProblemDto): Promise<ResponseType> {
      const problemId = Date.now() + Math.floor(Math.random() * 1000);
      const newProblem = await this.leetCodeProblemRepository.create({
        ...problemData,
        creatorUserId,
        problemId
      });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: newProblem,
      };
    }

  async updateProblem(creatorUserId: string, id: string, updateData: UpdateLeetCodeProblemDto): Promise<ResponseType> {
    const updatedProblem = await this.leetCodeProblemRepository.findOneAndUpdate({ _id: new Types.ObjectId(id)}, updateData);
    if (!updatedProblem) {
      throw new NotFoundException(`Problem with ID ${id} not found`);
    }

    return {
      code: CodeResponseEnum.SUCCESS,
      data: updatedProblem,
    };
  }

  async searchProblems(query: string): Promise<ResponseType> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}search:${query}`;
    const cachedResults = await this.redisService.get(cacheKey);

    if (cachedResults) {
      return {
        code: CodeResponseEnum.SUCCESS,
        data: cachedResults,
      };
    }

    const regex = new RegExp(query, 'i');
    const problems = await this.leetCodeProblemRepository.findByQuery({
      $or: [
        { title: { $regex: regex } },
        { content: { $regex: regex } },
        { topicTags: { $regex: regex } },
      ],
    });

    await this.redisService.set(cacheKey, problems, { ttl: this.CACHE_TTL_SECONDS });

    return {
      code: CodeResponseEnum.SUCCESS,
      data: problems,
    };
  }
} 