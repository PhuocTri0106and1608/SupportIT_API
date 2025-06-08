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

}
