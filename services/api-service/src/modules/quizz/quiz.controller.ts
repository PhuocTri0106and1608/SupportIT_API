import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { QuizService } from './quiz.service';
import { AuthGuard } from '@common/guards';
import { AnyRoleGuard, JwtAccessTokenAuthGuard, RolesGuard } from '@modules/auth/guards';
import { AdminActionEnum, LoginRoleEnum, SubjectEnum } from '@common/enums';
import { ResponseType } from '@common/dtos';
import { AnyRole, ApiOkResponseCustom, CheckAbilites } from '@common/decorators';
import { FilterQuizzesRequestDto } from './dtos';
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

  @Get("getAllCategories")
  @ApiOkResponseCustom(ResponseType)
  async getAllCategories(): Promise<ResponseType> {
    return await this.quizService.getAllCategories();
  }

  @Get("getListQuizzes")
  // @UseGuards(AuthGuard, AnyRoleGuard)
  // @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER, LoginRoleEnum.ADMIN)
  @ApiOkResponseCustom(ResponseType)
  async getListQuizzes(@Query() query: FilterQuizzesRequestDto): Promise<ResponseType> {
    return await this.quizService.getListQuizzes(query);
  }
}