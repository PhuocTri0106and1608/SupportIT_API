import { ApiProperty } from '@nestjs/swagger';
import { IsString,  } from 'class-validator';

export class CVDto {
  @ApiProperty()
  @IsString()
  fileUrl: string;

  @ApiProperty()
  @IsString()
  jobDescription: string;
}
