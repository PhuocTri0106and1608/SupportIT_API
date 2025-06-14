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
import { ApiProperty, PartialType } from '@nestjs/swagger';

class QuestionDto {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @ApiProperty()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @IsNumber()
  @Min(0)
  @ApiProperty()
  correctAnswer: number;

  @IsOptional()
  @IsString()
  @ApiProperty()
  explanation?: string;
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsArray()
  @ArrayNotEmpty()
  @ApiProperty()
  @IsString({ each: true })
  categories: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  sourceUrl: string;

  @IsArray()
  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  duration?: number;
}

export class UpdateQuizDto extends PartialType(CreateQuizDto) { }
