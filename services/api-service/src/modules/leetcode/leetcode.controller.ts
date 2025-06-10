import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeetCodeCrawlerService } from './leetcode-crawler.service';
import { LeetCodeService } from './leetcode.service';
import { AnyRoleGuard, JwtAccessTokenAuthGuard } from '@modules/auth/guards';
import { AnyRole, ApiOkResponseCustom, CheckAbilites, CurrentUser } from '@common/decorators';
import { AdminAbilitiesGuard } from '@modules/admin/guards';
import { AdminActionEnum, LoginRoleEnum, SubjectEnum } from '@common/enums';
import { CreateLeetCodeProblemDto, FilterProblemsRequestDto, UpdateLeetCodeProblemDto } from './dtos';
import { ResponseType } from '@common/dtos';
import { AuthGuard } from '@common/guards';

@ApiTags('LeetCode')
@ApiBearerAuth('access-token')
@Controller('leetcode')
export class LeetCodeController {
  constructor(
    private readonly leetCodeCrawlerService: LeetCodeCrawlerService,
    private readonly leetCodeService: LeetCodeService,
  ) { }

  @Get('problems')
  @ApiOkResponseCustom(ResponseType)
  async getAllProblems(@Query() filterDto: FilterProblemsRequestDto) {
    const { page, limit, difficulty, tag, search, creatorUserId } = filterDto;

    if (search) {
      return this.leetCodeService.searchProblems(search);
    }

    return this.leetCodeService.getAllProblems(page, limit, difficulty, tag, creatorUserId);
  }

  @Get('problems/:id')
  @ApiOkResponseCustom(ResponseType)
  async getProblemById(@Param('id') id: number) {
    return this.leetCodeService.getProblemById(id);
  }

  @Get('problems/slug/:slug')
  @ApiOkResponseCustom(ResponseType)
  async getProblemBySlug(@Param('slug') slug: string) {
    return this.leetCodeService.getProblemBySlug(slug);
  }

  @Get('tags')
  @ApiOkResponseCustom(ResponseType)
  async getAllTags() {
    return this.leetCodeService.getAllTopicTags();
  }

  @Post("create-problem")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async createProblem(@CurrentUser("id") userId: string, @Body() body: CreateLeetCodeProblemDto): Promise<ResponseType> {
    return this.leetCodeService.createProblem(userId, body);
  }

  @Patch("update-problem/:problemId")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async updateQuiz(@CurrentUser("id") userId: string, @Param("problemId") problemId: string, @Body() body: UpdateLeetCodeProblemDto): Promise<ResponseType> {
    return this.leetCodeService.updateProblem(userId, problemId, body);
  }

  @Post('crawl')
  @UseGuards(JwtAccessTokenAuthGuard, AdminAbilitiesGuard)
  @CheckAbilites({ action: AdminActionEnum.MANAGE, subject: SubjectEnum.ALL })
  @ApiOkResponseCustom(ResponseType)
  async crawlLeetCodeProblems() {
    await this.leetCodeCrawlerService.crawlAllProblems();
    return { message: 'Crawling process started' };
  }
} 