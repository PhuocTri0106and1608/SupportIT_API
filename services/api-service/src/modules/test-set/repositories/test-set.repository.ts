import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TestSet } from "../schemas/test-set.schema";

@Injectable()
export class TestSetRepository extends BaseMongoRepository<TestSet> {
  constructor(@InjectModel(TestSet.name) private readonly testSetModel: Model<TestSet>) {
    super(testSetModel);
  }

}
