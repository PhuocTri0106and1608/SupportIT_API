import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { QuizService } from './quiz.service';
import { AuthGuard } from '@common/guards';
import { AnyRoleGuard, RolesGuard } from '@modules/auth/guards';
import { LoginRoleEnum } from '@common/enums';
import { ResponseType } from '@common/dtos';
import { AnyRole, ApiOkResponseCustom } from '@common/decorators';
import { FilterQuizzesRequestDto } from './dtos';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags("Quiz")
@ApiBearerAuth("access-token")
@Controller('quiz')
export class QuizController {
  constructor(private readonly crawlerService: CrawlerService,
    private readonly quizService: QuizService
  ) { }

  @Get('crawl')
  @UseGuards(AuthGuard, RolesGuard)
  @AnyRole(LoginRoleEnum.ADMIN)
  @ApiOkResponseCustom(ResponseType)
  async manualTrigger() {
    await this.crawlerService.crawlAllCategories();
    return { message: '✅ Crawling completed manually' };
  }

  @Get("getAllCategories")
  @ApiOkResponseCustom(ResponseType)
  async getAllCategories(): Promise<ResponseType> {
    return await this.quizService.getAllCategories();
  }

  @Get("getListQuizzes")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER, LoginRoleEnum.ADMIN)
  @ApiOkResponseCustom(ResponseType)
  async getListQuizzes(@Query() query: FilterQuizzesRequestDto): Promise<ResponseType> {
    return await this.quizService.getListQuizzes(query);
  }
}