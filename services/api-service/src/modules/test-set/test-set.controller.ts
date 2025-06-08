import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@common/guards';
import { AnyRoleGuard } from '@modules/auth/guards';
import { LoginRoleEnum } from '@common/enums';
import { ResponseType } from '@common/dtos';
import { AnyRole, ApiOkResponseCustom, CurrentUser } from '@common/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TestSetService } from './test-set.service';
import { LinkTestSetDto, UpdateTestSetDto } from './dtos';

@ApiTags("Test Set")
@ApiBearerAuth("access-token")
@Controller('testSet')
export class TestSetController {
  constructor(
    private readonly testSetService: TestSetService
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

  @Get("updateTestSet")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async updateTestSetByJD(@Query() dto: UpdateTestSetDto): Promise<ResponseType> {
    return this.testSetService.updateTestSetByJD(dto);
  }
}