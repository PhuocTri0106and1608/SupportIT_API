import { BaseSchema } from '@common/schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TestSetDocument = HydratedDocument<TestSet>;

@Schema({ timestamps: true, versionKey: false })
export class TestSet extends BaseSchema {
  @Prop({ required: true }) creatorUserId: string;
  @Prop({ required: true }) quizId: string;
  @Prop({ required: true }) problemId: string;
  @Prop({ required: true, unique: true }) jdId: string;
  @Prop({ default: 0 })
  duration: number;
}

export const TestSetSchema = SchemaFactory.createForClass(TestSet);
TestSetSchema.index({ jdId: 1, quizId: 1, problemId: 1 });
