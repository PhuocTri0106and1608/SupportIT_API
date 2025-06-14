import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@common/guards';
import { AnyRoleGuard } from '@modules/auth/guards';
import { LoginRoleEnum } from '@common/enums';
import { ResponseType } from '@common/dtos';
import { AnyRole, ApiOkResponseCustom, CurrentUser } from '@common/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LinkTestSetDto, SubmitProblemTestSetDto, SubmitQuizTestSetDto, UpdateTestSetDto } from './dtos';
import { TestSetResultService, TestSetService } from './services';

@ApiTags("Test Set")
@ApiBearerAuth("access-token")
@Controller('testSet')
export class TestSetController {
  constructor(
    private readonly testSetService: TestSetService,
    private readonly testSetResultService: TestSetResultService,
  ) { }

  @Post("linkTestSet")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async linkTestSet(@CurrentUser("id") creatorUserId: string, @Body() body: LinkTestSetDto): Promise<ResponseType> {
    return this.testSetService.linkTestSet({creatorUserId, ...body});
  }

  @Get("getTestSetDetail/:jdId")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async getTestSetDetail(@Param("jdId") jdId: string): Promise<ResponseType> {
    return this.testSetService.getTestSetByJD(jdId);
  }

  @Patch("updateTestSet")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async updateTestSetByJD(@Query() dto: UpdateTestSetDto): Promise<ResponseType> {
    return this.testSetService.updateTestSetByJD(dto);
  }

  @Post("startTestSet/:testSetId")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async startTestSet(@CurrentUser("id") candidateId: string, @Param("testSetId") testSetId: string): Promise<ResponseType> {
    return this.testSetResultService.startTestSet({candidateId, testSetId});
  }

  @Post("submitQuizTestSet")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async submitQuizTestSet(
    @CurrentUser("id") candidateId: string,
    @Body() body: SubmitQuizTestSetDto,
  ): Promise<ResponseType> {
    const { testSetResultId, quizId, ...submitData } = body;
    return this.testSetResultService.submitQuizTestSet({
      testSetResultId,
      quizId,
      candidateId,
      submitData,
    });
  }

  @Post("submitProblemTestSet")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async submitProblemTestSet(
    @CurrentUser("id") candidateId: string,
    @Body() body: SubmitProblemTestSetDto,
  ): Promise<ResponseType> {
    const { testSetResultId, ...submitData } = body;
    return this.testSetResultService.submitProblemTestSet({
      testSetResultId,
      candidateId,
      submitData,
    });
  }

  @Post("submitFinalTestSet/:testSetId")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async submitFinalTestSet(
    @Param("testSetResultId") testSetResultId: string,
  ): Promise<ResponseType> {
    return this.testSetResultService.submitFinalTestSet(testSetResultId);
  }

  @Get("getTestSetResult/:testSetResultId")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async getTestSetResult(@Param("testSetResultId") testSetResultId: string): Promise<ResponseType> {
    return this.testSetResultService.getTestSetResultById(testSetResultId);
  }
}