import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";
import { QuizRepository } from "./repositories";
import { FilterQuizzesRequestDto } from "./dtos";

@Injectable()
export class QuizService {

  constructor(
    private readonly quizRepository: QuizRepository
  ) { }

  async getAllCategories(): Promise<ResponseType<string[]>> {
    try {
      const categories = await this.quizRepository.getAllCategories();
      return {
        code: CodeResponseEnum.SUCCESS,
        data: categories
      };
    } catch (error) {
      throw new HttpException("getAllCategories error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }
  async getListQuizzes(query: FilterQuizzesRequestDto): Promise<ResponseType> {
    const { page = 1, limit = 10, category } = query;
    const skip = (page - 1) * limit;

    try {
      const filter: any = { deletedAt: null };
      if (category) {
        filter["category"] = category;
      }

      const [quizzes, total] = await Promise.all([
        this.quizRepository.findWithPagination(filter, skip, limit),
        this.quizRepository.countDocuments(filter)
      ]);

      return {
        code: CodeResponseEnum.SUCCESS,
        data: {
          items: quizzes,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      throw new HttpException("getListQuizzes error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }

}
