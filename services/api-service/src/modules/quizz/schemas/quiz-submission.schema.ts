import { BaseSchema } from '@common/schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuizSubmissionDocument = HydratedDocument<QuizSubmission>;

@Schema({ timestamps: true, versionKey: false })
export class QuizSubmission extends BaseSchema {
  @Prop({ type: String, required: true })
  quizId: string;

  @Prop({ type: String, required: true })
  candidateId: string;

  @Prop([{
    _id: false,
    qIndex: Number,
    chosenOption: Number,
    isCorrect: Boolean,
  }])
  answers: { qIndex: number; chosenOption: number; isCorrect: boolean }[];

  @Prop() score: number;

  @Prop() duration: number;

  @Prop() actualDuration: number;

  @Prop() startTime: Date;

  @Prop() endTime: Date;
}

export const QuizSubmissionSchema = SchemaFactory.createForClass(QuizSubmission);
QuizSubmissionSchema.index({ quizId: 1, candidateId: 1 });