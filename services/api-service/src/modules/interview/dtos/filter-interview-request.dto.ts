import { PageOptionsDto } from "@common/dtos";
import { InterviewLevel, InterviewPosition } from "@common/enums";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class FilterInterviewRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: InterviewLevel.INTERN, enum: InterviewLevel })
  @IsEnum(InterviewLevel)
  @IsOptional()
  level?: InterviewLevel;

  @ApiPropertyOptional({ example: InterviewPosition.BACKEND, enum: InterviewPosition })
  @IsEnum(InterviewPosition)
  @IsOptional()
  position?: InterviewPosition;

  @ApiPropertyOptional({ example: 'NestJS' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'jobId123' })
  @IsString()
  @IsOptional()
  jobId?: string;
}