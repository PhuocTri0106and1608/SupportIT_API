import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

class ParamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  value: string;
}

class TestcaseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParamDto)
  params: ParamDto[];

  @IsString()
  @IsNotEmpty()
  expected: string;

  @IsOptional()
  @IsString()
  explanation?: string;
}

class CodeSnippetDto {
  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class CreateLeetCodeProblemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  titleSlug: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Easy', 'Medium', 'Hard'], { message: 'Difficulty must be one of Easy, Medium, Hard' })
  difficulty: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topicTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CodeSnippetDto)
  codeSnippets?: CodeSnippetDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestcaseDto)
  testcases?: TestcaseDto[];
}

export class UpdateLeetCodeProblemDto extends PartialType(CreateLeetCodeProblemDto) { }