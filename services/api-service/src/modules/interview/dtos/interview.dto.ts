import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { InterviewLevel, InterviewPosition } from '@common/enums';

export class QuestionSetDto {
  @ApiProperty({ example: 'What is a closure in JavaScript?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'A closure is a function that has access to its outer function scope even after the outer function has returned.' })
  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class InterviewDto {
  @ApiProperty({ example: InterviewLevel.INTERN, enum: InterviewLevel })
  @IsEnum(InterviewLevel)
  @IsNotEmpty()
  level: InterviewLevel;

  @ApiProperty({ example: InterviewPosition.BACKEND, enum: InterviewPosition })
  @IsEnum(InterviewPosition)
  @IsNotEmpty()
  position: InterviewPosition;

  @ApiProperty({ example: 'NestJS' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ example: 'jobId123' })
  @IsString()
  @IsOptional()
  jobId?: string;

  @ApiProperty({ type: [QuestionSetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionSetDto)
  questionSet: QuestionSetDto[];
}

export class CreateInterviewDto extends InterviewDto { }

export class UpdateInterviewDto extends PartialType(InterviewDto) { }
