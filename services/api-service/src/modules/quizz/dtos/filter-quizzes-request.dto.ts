import { PageOptionsDto } from "@common/dtos";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class FilterQuizzesRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'UGC-NET' })
  @IsString()
  @IsOptional()
  category?: string;
}