import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum DifficultyEnum {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export class FilterProblemsRequestDto {
  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ required: false, enum: DifficultyEnum })
  @IsEnum(DifficultyEnum)
  @IsOptional()
  difficulty?: DifficultyEnum;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;
} 