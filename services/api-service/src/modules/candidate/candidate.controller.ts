import { AnyRole, ApiOkResponseCustom, CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CandidateService } from "./candidate.service";
import { AnyRoleGuard } from "@modules/auth/guards";
import { CodeResponseEnum, LoginRoleEnum } from "@common/enums";
import { BaseInformationDto, ResponseType } from "@common/dtos";
import { UpdateCandidateDto } from "./dtos";

@Controller("candidates")
@ApiTags("Candidates")
@ApiBearerAuth("access-token")
@UseGuards(AuthGuard)
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) { }

  @Post("updateCandidateProfile")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE)
  @ApiOkResponseCustom(ResponseType)
  async createOrUpdateCandidate(@CurrentUser("id") candidateId: string, @Body() body: UpdateCandidateDto): Promise<ResponseType> {
    return {
      code: CodeResponseEnum.SUCCESS,
      data: this.candidateService.createOrUpdateCandidate({
        userId: candidateId,
        data: body
      })
    }
  }
}
