import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InterviewResult } from "../schemas/interview-result.schema";

@Injectable()
export class InterviewResultRepository extends BaseMongoRepository<InterviewResult> {
  constructor(@InjectModel(InterviewResult.name) private readonly interviewResultModel: Model<InterviewResult>) {
    super(interviewResultModel);
  }
}
