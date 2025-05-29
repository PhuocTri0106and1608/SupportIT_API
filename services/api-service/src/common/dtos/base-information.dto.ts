import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class BaseInformationDto {
  @IsArray()
  @ApiProperty()
  @IsString({ each: true })
  experience: string[];

  @IsArray()
  @ApiProperty()
  @IsString({ each: true })
  skills: string[];

  @IsOptional()
  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  education?: string[];

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional()
  @IsString({ each: true })
  projects?: string[];

  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}
