import { PageOptionsDto } from "@common/dtos";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class FilterQuizzesRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'UGC-NET' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  creatorUserId?: string;
}

export class QuizResponseDto {
  @Expose()
  @ApiProperty()
  @Transform(({ value }) => typeof value === 'object' ? value.toString() : value)
  _id: string;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  categories: string[];

  @Expose()
  @ApiProperty()
  sourceUrl: string;

  @Expose()
  @ApiProperty()
  questions: {
    question: string;
    options: string[];
  }[];

  @Expose()
  @ApiProperty()
  duration: number;
}