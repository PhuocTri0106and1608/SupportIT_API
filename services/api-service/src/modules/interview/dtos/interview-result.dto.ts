import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class InterviewResultDto {
  @ApiProperty({ example: '65c7d0d0c3a6b7e8f9a0b1c5' })
  @IsString()
  @IsNotEmpty()
  jdId: string;

  @ApiProperty({ example: '65c7d0d0c3a6b7e8f9a0b1c6' })
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @ApiPropertyOptional({ example: 85 })
  @IsNumber()
  @IsOptional()
  totalScore?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  submitted?: boolean;

  @ApiPropertyOptional({ example: 60 })
  @IsNumber()
  @IsOptional()
  actualDuration?: number;

  @ApiPropertyOptional({ example: '2025-06-26T10:00:00Z' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startedAt?: Date;

  @ApiPropertyOptional({ example: '2025-06-26T11:00:00Z' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endAt?: Date;
}

export class CreateInterviewResultDto extends InterviewResultDto {}

export class UpdateInterviewResultDto extends PartialType(InterviewResultDto) {}