import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Quiz } from "../schemas/quiz.schema";

@Injectable()
export class QuizRepository extends BaseMongoRepository<Quiz> {
  constructor(@InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>) {
    super(quizModel);
  }
}
