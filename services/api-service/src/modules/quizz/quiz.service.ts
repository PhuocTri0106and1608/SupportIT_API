import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";
import { QuizRepository } from "./repositories";
import { FilterQuizzesRequestDto } from "./dtos";
import { RedisService } from "@modules/redis";

@Injectable()
export class QuizService {

  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly redisService: RedisService,
  ) { }

  async getAllCategories(): Promise<ResponseType<any>> {
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

      const [quizzes, total] = await Promise.all([
        this.quizRepository.findWithPagination(filter, skip, limit),
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

}
