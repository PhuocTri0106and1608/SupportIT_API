import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class FilterApplicationsRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  candidateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cvId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evaluationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: "pending" | "shortlisted" | "rejected" | "accepted";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  creatorUserId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
} 