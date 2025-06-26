import { PageOptionsDto } from "@common/dtos";
import { InterviewType } from "@common/enums";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, ValidateNested, IsMongoId, IsDate, IsNumber, IsBoolean } from "class-validator";
import { Type } from "class-transformer";

export class FilterInterviewQuestionRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'What is a closure?' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: InterviewType.BEHAVIORAL_SITUATIONAL, enum: InterviewType })
  @IsEnum(InterviewType)
  @IsOptional()
  type?: InterviewType;

  @ApiPropertyOptional({ example: 'user123' })
  @IsString()
  @IsOptional()
  creatorUserId?: string;

  @ApiPropertyOptional({ example: 'JavaScript' })
  @IsString()
  @IsOptional()
  expectedKeyword?: string;
}

export class FilterInterviewAnswerRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: '65c7d0d0c3a6b7e8f9a0b1c5' })
  @IsString()
  @IsOptional()
  jdId?: string;

  @ApiPropertyOptional({ example: '65c7d0d0c3a6b7e8f9a0b1c3' })
  @IsString()
  @IsOptional()
  questionId?: string;

  @ApiPropertyOptional({ example: '65c7d0d0c3a6b7e8f9a0b1c4' })
  @IsMongoId()
  @IsOptional()
  evaluatorUserId?: string;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00Z', description: 'Filter responses submitted after this date' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  submittedAfter?: Date;

  @ApiPropertyOptional({ example: '2025-06-30T23:59:59Z', description: 'Filter responses submitted before this date' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  submittedBefore?: Date;

  @ApiPropertyOptional({ example: 70, description: 'Filter responses with an overall score above a certain threshold' })
  @IsNumber()
  @IsOptional()
  minOverallQuestionScore?: number;
}

export class FilterInterviewResultRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: '65c7d0d0c3a6b7e8f9a0b1c5' })
  @IsString()
  @IsOptional()
  jdId?: string;

  @ApiPropertyOptional({ example: '65c7d0d0c3a6b7e8f9a0b1c6' })
  @IsString()
  @IsOptional()
  candidateId?: string;

  @ApiPropertyOptional({ example: 75, description: 'Filter results with total score above a certain threshold' })
  @IsNumber()
  @IsOptional()
  minTotalScore?: number;

  @ApiPropertyOptional({ example: true, description: 'Filter submitted results' })
  @IsBoolean()
  @IsOptional()
  submitted?: boolean;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00Z', description: 'Filter results starting after this date' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startedAfter?: Date;

  @ApiPropertyOptional({ example: '2025-06-30T23:59:59Z', description: 'Filter results starting before this date' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startedBefore?: Date;
}