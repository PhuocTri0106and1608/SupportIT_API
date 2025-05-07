import { PageOptionsDto } from "@common/dtos";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class FilterSubmissionsRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: "Lọc theo quizId", example: "605c5f2e9f1b2c0015a3d123" })
  @IsString()
  @IsOptional()
  quizId?: string;

  @ApiPropertyOptional({ description: "Lọc theo candidateId", example: "605c5f2e9f1b2c0015a3d456" })
  @IsString()
  @IsOptional()
  candidateId?: string;
}