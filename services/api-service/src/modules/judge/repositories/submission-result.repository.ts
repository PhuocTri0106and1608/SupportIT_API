import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubmissionResult, SubmissionResultDocument } from '../schemas/submission-result.schema';
import { BaseMongoRepository } from '@common/repositories';

@Injectable()
export class SubmissionResultRepository extends BaseMongoRepository<SubmissionResultDocument> {
  constructor(
    @InjectModel(SubmissionResult.name)
    private readonly submissionResultModel: Model<SubmissionResultDocument>,
  ) {
    super(submissionResultModel);
  }

  async findByUserId(userId: string): Promise<SubmissionResultDocument[]> {
    return this.submissionResultModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findByProblemId(problemId: number): Promise<SubmissionResultDocument[]> {
    return this.submissionResultModel.find({ problemId }).sort({ createdAt: -1 }).exec();
  }

  async findByUserAndProblem(userId: string, problemId: number): Promise<SubmissionResultDocument[]> {
    return this.submissionResultModel
      .find({ userId, problemId })
      .sort({ createdAt: -1 })
      .exec();
  }
}