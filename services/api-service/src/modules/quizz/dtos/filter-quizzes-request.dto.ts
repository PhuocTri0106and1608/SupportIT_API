import { PageOptionsDto } from "@common/dtos";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class FilterQuizzesRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'UGC-NET' })
  @IsString()
  @IsOptional()
  category?: string;
}

export class QuizResponseDto {
  @Expose()
  @ApiProperty()
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