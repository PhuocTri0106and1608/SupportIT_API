import { BaseSchema } from '@common/schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InterviewResultDocument = HydratedDocument<InterviewResult>;

@Schema({ timestamps: true, versionKey: false })
export class InterviewResult extends BaseSchema {
  @Prop({ type: String, required: true })
  jdId: string;

  @Prop({ type: String, required: true })
  candidateId: string;

  @Prop({ type: [String], default: [] })
  completedQuestionIds: string[];

  @Prop({ type: [String], default: [] })
  answerIds: string[];

  @Prop({ type: Number, default: 0 })
  totalScore: number;

  @Prop({ default: false }) submitted: boolean; 

  @Prop({ type: Number, default: 0 })
  actualDuration: number;

  @Prop({ type: Date, default: new Date() })
  startedAt: Date;

  @Prop({ type: Date, default: new Date() })
  endAt: Date;
}

export const InterviewResultSchema = SchemaFactory.createForClass(InterviewResult);
InterviewResultSchema.index({ jdId: 1, candidateId: 1 }, { unique: true });
InterviewResultSchema.index({ jdId: 1, submitted: 1, startedAt: 1, totalScore: -1 }, { unique: false });