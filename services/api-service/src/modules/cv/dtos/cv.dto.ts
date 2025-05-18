import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsIn, IsObject, IsOptional, IsString, ValidateNested, } from 'class-validator';
import { BaseInformation } from '../schemas';
import { Type } from 'class-transformer';

export class CVDto {
  @ApiProperty()
  @IsString()
  fileUrl: string;

  @ApiProperty()
  @IsString()
  jobDescription: string;
}

export class CVUploadDto {
  @IsString()
  @ApiProperty()
  fileUrl: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  fileName?: string;
}


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

export class CreateJdDto {
  @IsString()
  @ApiProperty()
  title: string;

  @IsString()
  @ApiProperty()
  description: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  location?: string;

  @Type(() => BaseInformationDto)
  @ValidateNested()
  @ApiProperty()
  @IsObject()
  requirements: BaseInformationDto;

  @IsArray()
  @ApiProperty()
  @IsString({ each: true })
  benefits: string[];

  @IsOptional()
  @ApiPropertyOptional()
  @IsEnum(['private', 'public'])
  visibility?: 'private' | 'public';
}
