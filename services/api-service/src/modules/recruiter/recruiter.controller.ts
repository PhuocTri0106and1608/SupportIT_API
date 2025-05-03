import { CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RecruiterService } from "./recruiter.service";

@Controller("recruiters")
@ApiTags("Recruiters")
@ApiBearerAuth("access-token")
@UseGuards(AuthGuard)
export class RecruiterController {
  constructor(private readonly recruiterService: RecruiterService) { }
}
