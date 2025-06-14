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
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

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
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  titleSlug: string;

  @IsString()
    @ApiProperty()
  @IsNotEmpty()
  @IsIn(['Easy', 'Medium', 'Hard'], { message: 'Difficulty must be one of Easy, Medium, Hard' })
  difficulty: string;

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  content: string;

  @IsOptional()
    @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  topicTags?: string[];

  @IsOptional()
  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @IsOptional()
  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CodeSnippetDto)
  codeSnippets?: CodeSnippetDto[];

  @IsOptional()
  @IsArray()
  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => TestcaseDto)
  testcases?: TestcaseDto[];
}

export class UpdateLeetCodeProblemDto extends PartialType(CreateLeetCodeProblemDto) { }