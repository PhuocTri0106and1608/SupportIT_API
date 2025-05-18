import { Injectable, NotFoundException } from '@nestjs/common';
import { LeetCodeProblemRepository } from './repositories';
import { ResponseType } from '@common/dtos';
import { CodeResponseEnum } from '@common/enums';

@Injectable()
export class LeetCodeService {
  constructor(private readonly leetCodeProblemRepository: LeetCodeProblemRepository) {}

  async getProblemById(id: number): Promise<ResponseType> {
    const problem = await this.leetCodeProblemRepository.findByProblemId(id);
    if (!problem) {
      throw new NotFoundException(`Problem with ID ${id} not found`);
    }

    return {
      code: CodeResponseEnum.SUCCESS,
      data: problem,
    };
  }

  async getProblemBySlug(slug: string): Promise<ResponseType> {
    const problem = await this.leetCodeProblemRepository.findByTitleSlug(slug);
    if (!problem) {
      throw new NotFoundException(`Problem with slug ${slug} not found`);
    }

    return {
      code: CodeResponseEnum.SUCCESS,
      data: problem,
    };
  }

  async getAllProblems(
    page: number = 1,
    limit: number = 10,
    difficulty?: string,
    tag?: string
  ): Promise<ResponseType> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (tag) {
      filter.topicTags = tag;
    }

    const [problems, total] = await Promise.all([
      this.leetCodeProblemRepository.findWithPagination(filter, skip, limit),
      this.leetCodeProblemRepository.countDocuments(filter),
    ]);

    return {
      code: CodeResponseEnum.SUCCESS,
      data: {
        problems,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getAllTopicTags(): Promise<ResponseType> {
    const problems = await this.leetCodeProblemRepository.find({});
    const tagsSet = new Set<string>();
    
    problems.forEach((problem) => {
      problem.topicTags.forEach((tag: string) => {
        tagsSet.add(tag);
      });
    });
    
    return {
      code: CodeResponseEnum.SUCCESS,
      data: Array.from(tagsSet).sort(),
    };
  }

  async searchProblems(query: string): Promise<ResponseType> {
    const regex = new RegExp(query, 'i');
    const problems = await this.leetCodeProblemRepository.findByQuery({
      $or: [
        { title: { $regex: regex } },
        { content: { $regex: regex } },
        { topicTags: { $regex: regex } },
      ],
    });

    return {
      code: CodeResponseEnum.SUCCESS,
      data: problems,
    };
  }
} 