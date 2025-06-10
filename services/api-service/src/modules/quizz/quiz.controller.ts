import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { QuizService } from './quiz.service';
import { AuthGuard } from '@common/guards';
import { AnyRoleGuard, JwtAccessTokenAuthGuard } from '@modules/auth/guards';
import { AdminActionEnum, LoginRoleEnum, SubjectEnum } from '@common/enums';
import { ResponseType } from '@common/dtos';
import { AnyRole, ApiOkResponseCustom, CheckAbilites, CurrentUser } from '@common/decorators';
import { CreateQuizDto, FilterQuizzesRequestDto, FilterSubmissionsRequestDto, SubmitQuizDto } from './dtos';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAbilitiesGuard } from '@modules/admin/guards';

@ApiTags("Quiz")
@ApiBearerAuth("access-token")
@Controller('quiz')
export class QuizController {
  constructor(private readonly crawlerService: CrawlerService,
    private readonly quizService: QuizService
  ) { }

  @Get('crawl')
  @CheckAbilites({ action: AdminActionEnum.CREATE, subject: SubjectEnum.QUIZZES })
  @UseGuards(JwtAccessTokenAuthGuard, AdminAbilitiesGuard)
  @ApiOkResponseCustom(ResponseType)
  async manualTrigger() {
    await this.crawlerService.crawlAllCategories();
    return { message: '✅ Crawling completed manually' };
  }

  @Post("submit/:quizId")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async submitQuiz(@CurrentUser("id") candidateId: string, @Param("quizId") quizId: string, @Body() body: SubmitQuizDto): Promise<ResponseType> {
    return this.quizService.submit(quizId, candidateId, body);
  }

  @Post("create-quiz")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async createQuiz(@CurrentUser("id") userId: string, @Body() body: CreateQuizDto): Promise<ResponseType> {
    return this.quizService.createQuiz(userId, body);
  }

  @Patch("update-quiz/:quizId")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async updateQuiz(@CurrentUser("id") userId: string, @Param("quizId") quizId: string, @Body() body: CreateQuizDto): Promise<ResponseType> {
    return this.quizService.updateQuiz(userId, quizId, body);
  }

  @Get("getListSubmissions")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async getListSubmissions(@Query() query: FilterSubmissionsRequestDto): Promise<ResponseType> {
    return this.quizService.getListSubmissions(query);
  }

  @Get("getAllCategories")
  @ApiOkResponseCustom(ResponseType)
  async getAllCategories(): Promise<ResponseType> {
    return this.quizService.getAllCategories();
  }

  @Get("getListQuizzes")
  @ApiOkResponseCustom(ResponseType)
  async getListQuizzes(@Query() query: FilterQuizzesRequestDto): Promise<ResponseType> {
    return this.quizService.getListQuizzes(query);
  }

  @Get("getQuizDetail/:quizId")
  @ApiOkResponseCustom(ResponseType)
  async getQuizDetail(@Param("quizId") quizId: string): Promise<ResponseType> {
    return this.quizService.getQuizById(quizId);
  }
}