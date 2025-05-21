import { Body, Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JudgeService } from './judge.service';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AnyRole, ApiOkResponseCustom } from '@common/decorators';
import { ResponseType } from '@common/dtos';
import { LoginRoleEnum } from '@common/enums';

@ApiTags('Submit Code')
@ApiBearerAuth('access-token')
@Controller('judge')
export class JudgeController {
  constructor(
    private readonly judgeService: JudgeService,
  ) { }

  @Post('submit')
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
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async getSubmissions(
    @CurrentUser('id') currentUserId: string,
    @Query('userId') userId?: string,
    @Query('problemId') problemId?: string,
  ) {
    // Only allow administrators or the user themselves to view their submissions
    const queryUserId = userId || currentUserId;
    return this.judgeService.getSubmissions(queryUserId, problemId);
  }

  @Get('submissions/:id')
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async getSubmissionById(@Param('id') id: string) {
    return this.judgeService.getSubmissionById(id);
  }
} 