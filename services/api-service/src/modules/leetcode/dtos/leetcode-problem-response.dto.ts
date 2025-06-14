import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class LeetCodeProblemResponseDto {
  @Expose()
  @ApiProperty()
  @Transform(({ value }) => typeof value === 'object' ? value.toString() : value)
  _id: string;

  @Expose()
  @ApiProperty()
  problemId: number;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  titleSlug: string;

  @Expose()
  @ApiProperty()
  difficulty: string;

  @Expose()
  @ApiProperty()
  topicTags: string[];

  @Expose()
  @ApiProperty()
  sourceUrl: string;
}

export class ProblemPaginationResponseDto {
  @Expose()
  @ApiProperty({ type: [LeetCodeProblemResponseDto] })
  problems: LeetCodeProblemResponseDto[];

  @Expose()
  @ApiProperty()
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} 