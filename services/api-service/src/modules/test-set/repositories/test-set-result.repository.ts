import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TestSetResult } from "../schemas/test-set-result.schema";

@Injectable()
export class TestSetResultRepository extends BaseMongoRepository<TestSetResult> {
  constructor(@InjectModel(TestSetResult.name) private readonly testSetResultModel: Model<TestSetResult>) {
    super(testSetResultModel);
  }

  async findResultsByTestSetIdAndCandidateId(testSetId: string, candidateIds: string[]): Promise<any> {
    return this.testSetResultModel.find({
      testSetId,
      submitted: true,
      candidateId: { $in: candidateIds }
    }).sort({ finalScore: -1 }).lean();
  }
}
