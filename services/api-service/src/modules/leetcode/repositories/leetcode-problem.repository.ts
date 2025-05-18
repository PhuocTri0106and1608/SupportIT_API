import { BaseMongoRepository } from '@common/repositories';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { LeetCodeProblem } from '../schemas/leetcode-problem.schema';

@Injectable()
export class LeetCodeProblemRepository extends BaseMongoRepository<LeetCodeProblem> {
  constructor(
    @InjectModel(LeetCodeProblem.name)
    private readonly leetcodeProblemModel: Model<LeetCodeProblem>,
  ) {
    super(leetcodeProblemModel);
  }

  async findByProblemId(problemId: number): Promise<LeetCodeProblem | null> {
    return this.leetcodeProblemModel.findOne({ problemId }).exec();
  }

  async findByTitleSlug(titleSlug: string): Promise<LeetCodeProblem | null> {
    return this.leetcodeProblemModel.findOne({ titleSlug }).exec();
  }

  async findAllByDifficulty(difficulty: string): Promise<LeetCodeProblem[]> {
    return this.leetcodeProblemModel.find({ difficulty }).exec();
  }

  async findAllByTopicTag(tag: string): Promise<LeetCodeProblem[]> {
    return this.leetcodeProblemModel.find({ topicTags: tag }).exec();
  }

  async findByQuery(query: FilterQuery<LeetCodeProblem>): Promise<LeetCodeProblem[]> {
    return this.leetcodeProblemModel.find(query).exec();
  }
} 