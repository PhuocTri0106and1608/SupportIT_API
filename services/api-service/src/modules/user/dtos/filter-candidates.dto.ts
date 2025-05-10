import { PageOptionsDto } from "@common/dtos";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class FilterCandidateListDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: "Lọc theo email user" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: "Lọc theo tên user" })
  @IsOptional()
  @IsString()
  name?: string;
}
