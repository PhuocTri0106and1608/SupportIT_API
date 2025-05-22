import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitCodeDto {
  @ApiProperty({
    example: 'function sum(a, b) { return a + b; }',
  })
  @IsNotEmpty()
  @IsString()
  sourceCode: string;

  @ApiProperty({
    description: 'ID ngôn ngữ lập trình',
    example: 63,
  })
  @IsNotEmpty()
  @IsNumber()
  languageId: number;

  @ApiProperty({
    description: 'ID của bài tập',
    example: '123',
  })
  @IsNotEmpty()
  @IsNumber()
  problemId: number;
} 