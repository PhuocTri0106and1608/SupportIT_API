import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";
import { QuizRepository, QuizSubmissionRepository } from "./repositories";
import { FilterQuizzesRequestDto, FilterSubmissionsRequestDto, SubmitQuizDto } from "./dtos";
import { RedisService } from "@modules/redis";

@Injectable()
export class QuizService {

  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly subRepository: QuizSubmissionRepository,
    private readonly redisService: RedisService,
  ) { }

  async submit(
    quizId: string,
    candidateId: string,
    body: SubmitQuizDto,
  ): Promise<ResponseType> {
    const { answers } = body;
    try {
      const quiz = await this.quizRepository.findById(quizId);
      const feedback = answers.map(a => ({
        ...a,
        isCorrect: a.chosenOption === quiz.questions[a.qIndex].correctAnswer,
      }));
      const correctCount = feedback.filter(f => f.isCorrect).length;
      const score = Math.round((correctCount / quiz.questions.length) * 100);

      await this.subRepository.create({ quizId, candidateId, answers: feedback, score });
      return {
        code: CodeResponseEnum.SUCCESS,
        data: { score, total: quiz.questions.length, correctCount, feedback }
      };
    } catch (error) {
      throw new HttpException("submit error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }
  async getListSubmissions(query: FilterSubmissionsRequestDto): Promise<ResponseType> {
    const { page = 1, limit = 10, quizId, candidateId } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (quizId) filter.quizId = quizId;
    if (candidateId) filter.candidateId = candidateId;

    try {

      const [items, total] = await Promise.all([
        this.subRepository.findWithPagination(filter, skip, limit, true),
        this.subRepository.countDocuments(filter),
      ]);

      const result = {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      return { code: CodeResponseEnum.SUCCESS, data: result };
    } catch (error) {
      throw new HttpException("getListSubmissions error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }
  async getAllCategories(): Promise<ResponseType> {
    try {
      const cacheKey = 'quiz_categories_tree';
      const cached = await this.redisService.get<any>(cacheKey);

      if (cached) {
        return {
          code: CodeResponseEnum.SUCCESS,
          data: cached,
        };
      }

      const categoryPaths = await this.quizRepository.getAllCategories();

      const buildTree = (paths: string[][]) => {
        const root = {};

        for (const path of paths) {
          let currentLevel = root;
          for (const category of path) {
            if (!currentLevel[category]) {
              currentLevel[category] = {};
            }
            currentLevel = currentLevel[category];
          }
        }

        let idCounter = 1;

        const convertTreeToArray = (node: any): any[] => {
          return Object.keys(node).map((key) => {
            const children = convertTreeToArray(node[key]);
            const item = {
              id: idCounter++,
              name: key,
            };
            if (children.length > 0) {
              item['children'] = children;
            }
            return item;
          });
        };

        return convertTreeToArray(root);
      };

      const categoryTree = buildTree(categoryPaths);

      await this.redisService.set(cacheKey, categoryTree, { ttl: 60 * 60 });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: categoryTree,
      };
    } catch (error) {
      throw new HttpException("getAllCategories error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async getListQuizzes(query: FilterQuizzesRequestDto): Promise<ResponseType> {
    const { page = 1, limit = 10, category } = query;
    const skip = (page - 1) * limit;

    try {
      const filter: any = { deletedAt: null };
      if (category) {
        filter["categories"] = category;
      }

      const cacheKey = `quizzes:list:page=${page}:limit=${limit}:category=${category || 'all'}`;

      const cached = await this.redisService.get<any>(cacheKey);
      if (cached) {
        return {
          code: CodeResponseEnum.SUCCESS,
          data: cached,
        };
      }

      const selectFields: Record<string, 0 | 1> = {
        'questions.correctAnswer': 0,
        'questions.explanation': 0,
      };

      const [quizzes, total] = await Promise.all([
        this.quizRepository.findWithPagination(filter, skip, limit, true, selectFields),
        this.quizRepository.countDocuments(filter),
      ]);

      const resultData = {
        items: quizzes,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      await this.redisService.set(cacheKey, resultData, { ttl: 60 * 60 });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: resultData,
      };
    } catch (error) {
      throw new HttpException("getListQuizzes error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async getQuizById(id: string): Promise<ResponseType> {
    try {
      const cacheKey = `quizzes:${id}`;
      const cached = await this.redisService.get<any>(cacheKey);

      if (cached) {
        return {
          code: CodeResponseEnum.SUCCESS,
          data: cached,
        };
      }
      const selectFields: Record<string, 0 | 1> = {
        'questions.correctAnswer': 0,
        'questions.explanation': 0,
      };
      const quiz = await this.quizRepository.findById(id, true, selectFields);
      if (!quiz) {
        throw new HttpException("Quiz not found", HttpStatus.NOT_FOUND);
      }

      await this.redisService.set(cacheKey, quiz, { ttl: 60 * 60 });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: quiz,
      };
    } catch (error) {
      throw new HttpException("getQuizById error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

}
