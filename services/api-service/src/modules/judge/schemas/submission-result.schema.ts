import { BaseSchema } from '@common/schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubmissionResultDocument = HydratedDocument<SubmissionResult>;
export type TestCaseResultDocument = HydratedDocument<TestCaseResult>;

@Schema({ timestamps: true })
export class TestCaseResult extends BaseSchema {
  @Prop({ type: Object })
  testCase: any;

  @Prop({ type: Object })
  status: {
    id: number;
    description: string;
  };

  @Prop()
  stdout: string;

  @Prop()
  stderr: string;

  @Prop()
  compile_output: string;

  @Prop()
  time: number;

  @Prop()
  memory: number;

  @Prop()
  message: string;

  @Prop()
  passed: boolean;
}

export const TestCaseResultSchema = SchemaFactory.createForClass(TestCaseResult);
TestCaseResultSchema.index({ problemId: 1, userId: 1 }, { unique: true });

@Schema({ timestamps: true })
export class SubmissionResult extends BaseSchema {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  problemId: string;

  @Prop({ required: true })
  languageId: number;

  @Prop()
  languageName: string;

  @Prop({ required: true })
  sourceCode: string;

  @Prop()
  success: boolean;

  @Prop()
  passedTests: number;

  @Prop()
  totalTests: number;

  @Prop({ type: [TestCaseResultSchema] })
  testResults: TestCaseResult[];
}

export const SubmissionResultSchema = SchemaFactory.createForClass(SubmissionResult);
SubmissionResultSchema.index({ problemId: 1, userId: 1 }, { unique: true });
