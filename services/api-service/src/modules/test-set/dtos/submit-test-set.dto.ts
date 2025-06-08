import { SubmitCodeDto } from "@modules/judge/dto";
import { SubmitQuizDto } from "@modules/quizz/dtos";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class StartTestSetDto {
  @ApiProperty({  })
  @IsString()
  testSetId: string;
}

export class SubmitQuizTestSetDto extends SubmitQuizDto {
  @ApiProperty({ description: "The ID of the test set result" })
  @IsString()
  testSetResultId: string;

  @ApiProperty({ description: "The ID of the quiz" })
  @IsString()
  quizId: string;
}

export class SubmitProblemTestSetDto extends SubmitCodeDto {
  @ApiProperty({ description: "The ID of the test set result" })
  @IsString()
  testSetResultId: string;
}

export class SubmitFinalTestSetDto {
  @ApiProperty({ description: "The ID of the test set result" })
  @IsString()
  testSetResultId: string;
}