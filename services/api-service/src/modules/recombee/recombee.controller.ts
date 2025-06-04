import { Controller, Get, Query } from '@nestjs/common';
import { RecombeeService } from './recombee.service';
import { RecommendForCV, RecommendForJD } from './dtos';
import { ApiTags } from '@nestjs/swagger';
import { CodeResponseEnum } from '@common/enums';
import { ResponseType } from '@common/dtos';

@Controller('recombee')
@ApiTags("Recommends")
  
export class RecombeeController {
  constructor(private readonly recombeeService: RecombeeService) { }

  // @Get('recommend/cvs')
  // async recommendCVsForJD(@Query() query: RecommendForJD): Promise<ResponseType> {
  //   const data = await this.recombeeService.recommendCVsForJD(query.jdId, query.limit, query.page);
  //   return {
  //     data: data,
  //     code: CodeResponseEnum.SUCCESS,
  //   }
  // }

  @Get('recommend/jds')
  async recommendJDsForCandidate(@Query() query: RecommendForCV): Promise<ResponseType> {
    const data = await this.recombeeService.recommendJDsForCandidate(query.candidateId, query.limit, query.page);
    return {
      data: data,
      code: CodeResponseEnum.SUCCESS,
    }
  }

  @Get('recommend/candidates')
  async recommendCandidatesForJD(
    @Query() query: RecommendForJD,
  ): Promise<ResponseType> {
    const data = await this.recombeeService.recommendCandidatesForJD(query.jdId, query.limit, query.page);
    return {
      data: data,
      code: CodeResponseEnum.SUCCESS,
    }
  }
}