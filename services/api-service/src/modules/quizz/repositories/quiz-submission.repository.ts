import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { QuizSubmission } from "../schemas/quiz-submission.schema";

@Injectable()
export class QuizSubmissionRepository extends BaseMongoRepository<QuizSubmission> {
  constructor(@InjectModel(QuizSubmission.name) private readonly quizSubmissionModel: Model<QuizSubmission>) {
    super(quizSubmissionModel);
  }

}
