import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, PartialType, ApiProperty } from '@nestjs/swagger';
import { InterviewType } from '@common/enums'; // Import InterviewType từ common/enums

export class RubricTemplateScoreDto {
  @ApiProperty({ example: 5 })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({ example: 'Excellent' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class RubricTemplateDto {
  @ApiProperty({ example: 'Clarity of explanation' })
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @ApiProperty({ type: [RubricTemplateScoreDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricTemplateScoreDto)
  scores: RubricTemplateScoreDto[];
}

export class InterviewQuestionDto {
  @ApiProperty({ example: InterviewType.BEHAVIORAL_SITUATIONAL, enum: InterviewType })
  @IsEnum(InterviewType)
  @IsNotEmpty()
  type: InterviewType;

  @ApiProperty({ example: '65c7d0d0c3a6b7e8f9a0b1c5' })
  @IsString()
  @IsNotEmpty()
  jdId: string;

  @ApiProperty({ example: 'A closure is a function that has access to its outer function scope even after the outer function has returned.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: ['closure', 'scope', 'JavaScript'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  expectedKeywords: string[];

  @ApiProperty({ type: [RubricTemplateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricTemplateDto)
  rubric: RubricTemplateDto[];
}

export class CreateInterviewQuestionDto extends InterviewQuestionDto {}

export class UpdateInterviewQuestionDto extends PartialType(InterviewQuestionDto) {}