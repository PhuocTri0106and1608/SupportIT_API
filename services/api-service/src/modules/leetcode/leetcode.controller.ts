import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeetCodeCrawlerService } from './leetcode-crawler.service';
import { LeetCodeService } from './leetcode.service';
import { JwtAccessTokenAuthGuard } from '@modules/auth/guards';
import { ApiOkResponseCustom, CheckAbilites, CurrentUser } from '@common/decorators';
import { AdminAbilitiesGuard } from '@modules/admin/guards';
import { AdminActionEnum, SubjectEnum } from '@common/enums';
import { FilterProblemsRequestDto } from './dtos';
import { ResponseType } from '@common/dtos';

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
    const { page, limit, difficulty, tag, search } = filterDto;

    if (search) {
      return this.leetCodeService.searchProblems(search);
    }

    return this.leetCodeService.getAllProblems(page, limit, difficulty, tag);
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

  @Post('crawl')
  // @UseGuards(JwtAccessTokenAuthGuard, AdminAbilitiesGuard)
  // @CheckAbilites({ action: AdminActionEnum.MANAGE, subject: SubjectEnum.ALL })
  @ApiOkResponseCustom(ResponseType)
  async crawlLeetCodeProblems() {
    await this.leetCodeCrawlerService.crawlAllProblems();
    return { message: 'Crawling process started' };
  }
} 