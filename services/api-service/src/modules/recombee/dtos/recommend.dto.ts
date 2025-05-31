import { PageOptionsDto } from "@common/dtos";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class RecommendForJD extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  jdId?: string;
}

export class RecommendForCV extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  candidateId?: string;
}