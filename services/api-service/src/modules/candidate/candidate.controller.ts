import { CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CandidateService } from "./candidate.service";

@Controller("candidates")
@ApiTags("Candidates")
@ApiBearerAuth("access-token")
@UseGuards(AuthGuard)
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) { }
}
