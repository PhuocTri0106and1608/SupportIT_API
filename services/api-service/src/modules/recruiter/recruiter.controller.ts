import { AnyRole, ApiOkResponseCustom, CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RecruiterService } from "./recruiter.service";
import { UpdateRecruiterDto } from "./dtos";
import { LoginRoleEnum } from "@common/enums";
import { AnyRoleGuard } from "@modules/auth/guards";
import { ResponseType } from "@common/dtos";

@Controller("recruiters")
@ApiTags("Recruiters")
@ApiBearerAuth("access-token")
@UseGuards(AuthGuard)
export class RecruiterController {
  constructor(private readonly recruiterService: RecruiterService) { }

  @Post("updateRecruiter")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  @ApiOkResponseCustom(ResponseType)
  async createOrUpdateCandidate(@CurrentUser("id") recruiterId: string, @Body() data: UpdateRecruiterDto): Promise<ResponseType> {
    return this.recruiterService.updateRecruiter({
      userId: recruiterId,
      data: data
    })
  }
}
