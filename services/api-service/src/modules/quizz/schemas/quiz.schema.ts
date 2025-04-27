import { BaseSchema } from '@common/schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuizDocument = HydratedDocument<Quiz>;

@Schema({ timestamps: true, versionKey: false })
export class Quiz extends BaseSchema {
  @Prop() title: string;
  @Prop() categories: string[];
  @Prop() sourceUrl: string;
  @Prop([
    {
      _id: false,
      question: { type: String },
      options: [String],
      correctAnswer: Number,
      explanation: String,
    },
  ])
  questions: {
    question: string;
    options: string[];
    correctAnswer: Number;
    explanation?: string;
  }[];
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
QuizSchema.index({ categories: 1 });
