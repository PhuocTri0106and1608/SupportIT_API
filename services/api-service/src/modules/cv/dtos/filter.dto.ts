import { PageOptionsDto } from "@common/dtos";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum } from "class-validator";

export class FilterApplicationsRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'candidateId123' })
  @IsString()
  @IsOptional()
  candidateId?: string;

  @ApiPropertyOptional({ example: 'cvId123' })
  @IsString()
  @IsOptional()
  cvId?: string;

  @ApiPropertyOptional({ example: 'jdId123' })
  @IsString()
  @IsOptional()
  jdId?: string;

  @ApiPropertyOptional({ example: 'evaluationId123' })
  @IsString()
  @IsOptional()
  evaluationId?: string;

  @ApiPropertyOptional({ enum: ['pending', 'shortlisted', 'rejected', 'accepted'] })
  @IsEnum(['pending', 'shortlisted', 'rejected', 'accepted'])
  @IsOptional()
  status?: 'pending' | 'shortlisted' | 'rejected' | 'accepted';
}

export class FilterCVsRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'candidateId123' })
  @IsString()
  @IsOptional()
  candidateId?: string;

  // @ApiPropertyOptional({ example: 'cv_resume.pdf' })
  // @IsString()
  // @IsOptional()
  // fileName?: string;
}

export class FilterEvaluationsRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'candidateId123' })
  @IsString()
  @IsOptional()
  candidateId?: string;

  @ApiPropertyOptional({ example: 'cvId123' })
  @IsString()
  @IsOptional()
  cvId?: string;

  @ApiPropertyOptional({ example: 'jdId123' })
  @IsString()
  @IsOptional()
  jdId?: string;
}

export class FilterJDsRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'creatorUserId123' })
  @IsString()
  @IsOptional()
  creatorUserId?: string;

  @ApiPropertyOptional({ example: 'Frontend Developer' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Google' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Hà Nội' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ enum: ['private', 'public'] })
  @IsEnum(['private', 'public'])
  @IsOptional()
  visibility?: 'private' | 'public';
}
