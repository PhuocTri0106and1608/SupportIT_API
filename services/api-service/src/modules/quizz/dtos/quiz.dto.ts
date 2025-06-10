import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsOptional,
  IsNumber,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

class QuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @IsNumber()
  @Min(0)
  correctAnswer: number;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  categories: string[];

  @IsString()
  @IsNotEmpty()
  sourceUrl: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}

export class UpdateQuizDto extends PartialType(CreateQuizDto) { }
