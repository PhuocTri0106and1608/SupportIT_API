import { IsOptional, IsString, IsArray } from 'class-validator';

class TestResultDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  AIInterviewIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  TechnicalQuizIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  LiveCodingIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  SoftSkillsIds?: string[];
}

export class CandidateDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  cvId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appliedJobIds?: string[];

  @IsOptional()
  testResult?: TestResultDto;
}
