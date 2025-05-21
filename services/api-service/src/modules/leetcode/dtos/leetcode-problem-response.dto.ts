import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LeetCodeProblemResponseDto {
  @Expose()
  @ApiProperty()
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