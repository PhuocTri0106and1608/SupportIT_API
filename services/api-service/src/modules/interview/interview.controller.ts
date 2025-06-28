import { AnyRole, ApiOkResponseCustom, CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { InterviewService } from "./interview.service";
import { ResponseType } from "@common/dtos";
import { AnyRoleGuard, RolesGuard } from "@modules/auth/guards";
import { LoginRoleEnum } from "@common/enums";
import { CandidateAnswerDto, CreateInterviewQuestionDto, FilterInterviewAnswerRequestDto, FilterInterviewQuestionRequestDto, FilterInterviewResultRequestDto, InterviewMarkDto } from "./dtos";

@Controller("interviews")
@ApiTags("Interview Questions")
@ApiBearerAuth("access-token")
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) { }
  
  @Post("createInterviewQuestion")
  @UseGuards(AuthGuard, RolesGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async createInterviewQuestion(@CurrentUser("id") creatorUserId: string, @Body() request: CreateInterviewQuestionDto): Promise<ResponseType> {
    return this.interviewService.createInterviewQuestion(creatorUserId, request);
  }

  @Post("submitCandidateAnswer")
  @UseGuards(AuthGuard, RolesGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async submitCandidateAnswer(@CurrentUser("id") candidateId: string, @Body() request: CandidateAnswerDto): Promise<ResponseType> {
    return this.interviewService.submitCandidateAnswer(candidateId, request);
  }

  @Post("markCandidateAnswer")
  @UseGuards(AuthGuard, RolesGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async markCandidateAnswer(@CurrentUser("id") evaluatorUserId: string, @Body() request: InterviewMarkDto): Promise<ResponseType> {
    return this.interviewService.markCandidateAnswer(evaluatorUserId, request);
  }
  
  @Get("getListInterviewQuestions")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async getListInterviewQuestions(@Query() query: FilterInterviewQuestionRequestDto): Promise<ResponseType> {
    return this.interviewService.getListInterviewQuestions(query);
  }

  @Get("getListInterviewAnswers")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async getListInterviewAnswers(@Query() query: FilterInterviewAnswerRequestDto): Promise<ResponseType> {
    return this.interviewService.getListInterviewAnswers(query);
  }

  @Get("getListInterviewResults")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async getListInterviewResults(@Query() query: FilterInterviewResultRequestDto): Promise<ResponseType> {
    return this.interviewService.getListInterviewResults(query);
  }

}
