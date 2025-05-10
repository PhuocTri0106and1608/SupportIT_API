import { AnyRole, ApiOkResponseCustom, CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { InterviewService } from "./interview.service";
import { ResponseType } from "@common/dtos";
import { FilterInterviewRequestDto } from "./dtos/filter-interview-request.dto";
import { CreateInterviewDto } from "./dtos";
import { AnyRoleGuard, RolesGuard } from "@modules/auth/guards";
import { LoginRoleEnum } from "@common/enums";

@Controller("interviews")
@ApiTags("Interview Questions")
@ApiBearerAuth("access-token")
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) { }
  
  @Post("createInterview")
  @UseGuards(AuthGuard, RolesGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async createInterview(@Body() request: CreateInterviewDto): Promise<ResponseType> {
    return this.interviewService.createOrUpdateInterview(request);
  }
  
  @Get("getListInterviews")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async getListInterviews(@Query() query: FilterInterviewRequestDto): Promise<ResponseType> {
    return this.interviewService.getListInterviews(query);
  }

}
