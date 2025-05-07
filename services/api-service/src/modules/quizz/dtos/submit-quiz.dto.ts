import { IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({ description: 'Index of the question in the quiz', example: 0 })
  @IsInt()
  @Min(0)
  qIndex: number;

  @ApiProperty({ description: 'Index of the option chosen by the candidate', example: 2 })
  @IsInt()
  @Min(0)
  chosenOption: number;
}

export class SubmitQuizDto {
  @ApiProperty({
    description: 'Array of answers the candidate submitted',
    type: [AnswerDto],
    example: [{ qIndex: 0, chosenOption: 2 }, { qIndex: 1, chosenOption: 3 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
