import { Controller, Get, Query } from '@nestjs/common';
import { RecombeeService } from './recombee.service';
import { RecommendForCV, RecommendForJD } from './dtos';
import { ApiTags } from '@nestjs/swagger';

@Controller('recombee')
@ApiTags("Recommends")
  
export class RecombeeController {
  constructor(private readonly recombeeService: RecombeeService) { }

  @Get('recommend/cvs')
  async recommendCVsForJD(@Query() query: RecommendForJD) {
    return this.recombeeService.recommendCVsForJD(query.jdId, query.limit, query.page);
  }

  @Get('recommend/jds')
  async recommendJDsForCandidate(@Query() query: RecommendForCV) {
    return this.recombeeService.recommendJDsForCandidate(query.candidateId, query.limit, query.page);
  }

  @Get('recommend/candidates')
  async recommendCandidatesForJD(
    @Query() query: RecommendForJD,
  ) {
    return this.recombeeService.recommendCandidatesForJD(query.jdId, query.limit, query.page);
  }
}