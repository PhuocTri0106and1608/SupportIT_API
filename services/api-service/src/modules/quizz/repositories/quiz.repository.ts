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

  async getAllCategories(): Promise<string[]> {
    const result = await this.quizModel.aggregate([
      { $match: { category: { $ne: null } } },
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } }
    ]).exec();

    return result.map((item) => item._id);
  }
}
