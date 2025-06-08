import { BaseSchema } from '@common/schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TestSetResultDocument = HydratedDocument<TestSetResult>;

@Schema({ timestamps: true, versionKey: false })
export class TestSetResult extends BaseSchema {
  @Prop({ type: String, required: true })
  testSetId: string;

  @Prop({ type: String, required: true })
  candidateId: string;

  @Prop({ type: [String], default: [] })
  completedQuizIds: string[]; 

  @Prop({ type: [String], default: [] })
  completedProblemIds: string[]; 

  @Prop({ type: Number, default: 0 })
  totalQuizScore: number;

  @Prop({ type: Number, default: 0 })
  totalPassedCodingProblems: number;

  @Prop({ type: Number, default: 0 })
  totalCodingProblems: number;

  @Prop({ type: Number, default: 0 })
  finalScore: number;

  @Prop({ default: false }) submitted: boolean; 

  @Prop({ type: Number, default: 0 })
  actualDuration: number;

  @Prop({ type: Date, default: new Date() })
  startedAt: Date;

  @Prop({ type: Date, default: new Date() })
  endAt: Date;
}

export const TestSetResultSchema = SchemaFactory.createForClass(TestSetResult);
TestSetResultSchema.index({ testSetId: 1, candidateId: 1, finalScore: -1 }, { unique: true });