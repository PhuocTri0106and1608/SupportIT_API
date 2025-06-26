import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InterviewAnswer } from "../schemas/interview-answer.schema";

@Injectable()
export class InterviewAnswerRepository extends BaseMongoRepository<InterviewAnswer> {
  constructor(@InjectModel(InterviewAnswer.name) private readonly interviewAnswerModel: Model<InterviewAnswer>) {
    super(interviewAnswerModel);
  }
}
