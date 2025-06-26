import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InterviewQuestion } from "../schemas/interview-question.schema";

@Injectable()
export class InterviewQuestionRepository extends BaseMongoRepository<InterviewQuestion> {
  constructor(@InjectModel(InterviewQuestion.name) private readonly interviewQuestionModel: Model<InterviewQuestion>) {
    super(interviewQuestionModel);
  }
}
