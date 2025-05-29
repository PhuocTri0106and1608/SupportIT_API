import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class LinkTestSetDto {
  @ApiProperty({  })
  @IsString()
  jdId: string;

  @ApiProperty({  })
  @IsString()
  quizId: string;

  @ApiProperty({})
  @IsString()
  problemId: string;

  @ApiPropertyOptional({ description: "Duration is optional, if duration = 0, duration will be disabled" })
  @IsNumber()
  duration?: number;
}