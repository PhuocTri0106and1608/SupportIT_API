import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Interview } from "../schemas/interview.schema";

@Injectable()
export class InterviewRepository extends BaseMongoRepository<Interview> {
  constructor(@InjectModel(Interview.name) private readonly interviewModel: Model<Interview>) {
    super(interviewModel);
  }
}
