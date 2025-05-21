import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubmissionResult, SubmissionResultDocument } from '../schemas/submission-result.schema';

@Injectable()
export class SubmissionResultRepository {
  constructor(
    @InjectModel(SubmissionResult.name)
    private submissionResultModel: Model<SubmissionResultDocument>,
  ) { }

  async create(submissionResult: Partial<SubmissionResult>): Promise<SubmissionResult> {
    const newSubmission = new this.submissionResultModel(submissionResult);
    return newSubmission.save();
  }

  async findByUserId(userId: string): Promise<SubmissionResult[]> {
    return this.submissionResultModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findByProblemId(problemId: string): Promise<SubmissionResult[]> {
    return this.submissionResultModel.find({ problemId }).sort({ createdAt: -1 }).exec();
  }

  async findByUserAndProblem(userId: string, problemId: string): Promise<SubmissionResult[]> {
    return this.submissionResultModel
      .find({ userId, problemId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<SubmissionResult> {
    return this.submissionResultModel.findById(id).exec();
  }
} 