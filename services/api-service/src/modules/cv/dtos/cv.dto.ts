import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsIn, IsObject, IsOptional, IsString, ValidateNested, } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseInformationDto } from '@common/dtos';

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
