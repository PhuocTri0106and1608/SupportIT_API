import { Body, Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JudgeService } from './judge.service';
import { SubmitCodeDto, TestCodeDto } from './dto/submit-code.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AnyRole, ApiOkResponseCustom } from '@common/decorators';
import { ResponseType } from '@common/dtos';
import { LoginRoleEnum } from '@common/enums';
import { AnyRoleGuard } from '@modules/auth/guards/any-role.guard';
import { AuthGuard } from '@common/guards';

@ApiTags('Submit Code')
@ApiBearerAuth('access-token')
@Controller('judge')
export class JudgeController {
  constructor(
    private readonly judgeService: JudgeService,
  ) { }
  @Post('test')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async testCode(@CurrentUser('id') userId: string, @Body() testCodeDto: TestCodeDto) {
    const { sourceCode, languageId, problemId } = testCodeDto;
    return this.judgeService.testCode(userId, sourceCode, languageId, problemId);
  }

  @Post('submit')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async submitCode(@CurrentUser('id') userId: string, @Body() submitCodeDto: SubmitCodeDto) {
    const { sourceCode, languageId, problemId } = submitCodeDto;
    return this.judgeService.submitCode(userId, sourceCode, languageId, problemId);
  }

  @Get('languages')
  @ApiOkResponseCustom(ResponseType)
  async getSupportedLanguages() {
    return this.judgeService.getSupportedLanguages();
  }

  @Get('submissions')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async getSubmissions(
    @CurrentUser('id') currentUserId: string,
    @Query('problemId') problemId?: string,
  ) {
    const queryProblemId = problemId ? parseInt(problemId) : undefined;
    return this.judgeService.getSubmissions(currentUserId, queryProblemId);
  }

  @Get('submissions/:id')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async getSubmissionById(@Param('id') id: string) {
    return this.judgeService.getSubmissionById(id);
  }
} 