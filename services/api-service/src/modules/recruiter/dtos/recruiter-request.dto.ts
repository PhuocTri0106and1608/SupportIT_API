import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateRecruiterDto {
  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  companyWebsite?: string;
}