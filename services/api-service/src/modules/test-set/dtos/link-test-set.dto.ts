import { LeetCodeProblemResponseDto } from "@modules/leetcode/dtos";
import { QuizResponseDto } from "@modules/quizz/dtos";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsArray, IsNumber, IsString } from "class-validator";

export class LinkTestSetDto {
  @ApiProperty({  })
  @IsString()
  jdId: string;

  @ApiProperty({})
  @IsArray()
  @IsString({ each: true })
  quizIds: string[];

  @ApiProperty({})
  @IsArray()
  @IsString({ each: true })
  problemIds: string[];

  @ApiPropertyOptional({ description: "Duration is optional, if duration = 0, duration will be disabled" })
  @IsNumber()
  duration?: number;
}

export class UpdateTestSetDto extends LinkTestSetDto {}

export class TestSetResponseDto {
  @Expose()
  @ApiProperty()
  creatorUserId: string;

  @Expose()
  @ApiProperty()
  jdId: string;

  @Expose()
  @ApiProperty()
  duration: number;

  @Expose()
  @ApiProperty({ type: () => [QuizResponseDto] })
  quizzes: QuizResponseDto[];

  @Expose()
  @ApiProperty({ type: () => [LeetCodeProblemResponseDto] })
  problems: LeetCodeProblemResponseDto[];
}