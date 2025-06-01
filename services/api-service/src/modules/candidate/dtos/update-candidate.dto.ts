import { BaseInformationDto } from "@common/dtos";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class UpdateCandidateDto extends PartialType(BaseInformationDto) {
  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  position?: string;
}
