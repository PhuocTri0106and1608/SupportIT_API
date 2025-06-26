import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsDate, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, PartialType, ApiProperty } from '@nestjs/swagger';

export class CriterionScoreDetailDto {
  @ApiProperty({ example: 'analysis' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 8 })
  @IsNumber()
  @IsNotEmpty()
  score: number;
}
export class AiAnalysisResultDto {
  @ApiPropertyOptional({ example: ['closure', 'scope', 'JavaScript'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  identifiedKeywords?: string[];

  @ApiPropertyOptional({ example: 'positive' })
  @IsString()
  @IsOptional()
  sentiment?: string;

  @ApiPropertyOptional({ example: 'The candidate demonstrated a strong understanding of the topic.' })
  @IsString()
  @IsOptional()
  overallSuggestion?: string;
}

export class EvaluatedScoreDetailsDto {
  @ApiProperty({ type: [CriterionScoreDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionScoreDetailDto)
  criterionScores: CriterionScoreDetailDto[];

  @ApiPropertyOptional({ example: 85 })
  @IsNumber()
  @IsOptional()
  totalScoreForQuestion?: number;

  @ApiPropertyOptional({ example: 'Candidate showed excellent problem-solving skills.' })
  @IsString()
  @IsOptional()
  feedbackComments?: string;
}

export class CandidateAnswerDto {
  @ApiProperty({ example: '65c7d0d0c3a6b7e8f9a0b1c2' })
  @IsString()
  @IsNotEmpty()
  jdId: string;

  @ApiProperty({ example: '65c7d0d0c3a6b7e8f9a0b1c3' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiPropertyOptional({ example: 'A closure in JavaScript is a function that remembers its lexical scope...' })
  @IsString()
  @IsOptional()
  answerContentText?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio/answer1.mp3' })
  @IsString()
  @IsOptional()
  answerContentUrl?: string;
}

export class InterviewMarkDto {
  @ApiProperty({ example: '65c7d0d0c3a6b7e8f9a0b1c2' })
  @IsString()
  @IsNotEmpty()
  answerId: string;

  @ApiPropertyOptional({ type: EvaluatedScoreDetailsDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => EvaluatedScoreDetailsDto)
  evaluatedScoreDetails?: EvaluatedScoreDetailsDto;

  @ApiPropertyOptional({ example: 90 })
  @IsNumber()
  @IsOptional()
  overallQuestionScore?: number;
}