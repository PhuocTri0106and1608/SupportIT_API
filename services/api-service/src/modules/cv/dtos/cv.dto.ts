import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsObject, IsOptional, IsString, ValidateNested,  } from 'class-validator';
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
  @IsString() fileUrl: string;
  @IsOptional() @IsString() fileName?: string;
}


export class JDCreateDto {
  @IsString() jdText: string;
  @IsOptional() @IsIn(["private", "public"]) visibility?: "private" | "public";
}

