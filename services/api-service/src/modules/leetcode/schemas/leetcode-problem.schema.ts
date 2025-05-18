import { BaseSchema } from '@common/schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LeetCodeProblemDocument = HydratedDocument<LeetCodeProblem>;

@Schema({ timestamps: true, versionKey: false })
export class LeetCodeProblem extends BaseSchema {
  @Prop({ required: true, unique: true })
  problemId: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  titleSlug: string;

  @Prop({ required: true })
  difficulty: string; // 'Easy', 'Medium', 'Hard'

  @Prop()
  content: string; // HTML content

  @Prop([String])
  topicTags: string[];

  @Prop()
  likes: number;

  @Prop()
  dislikes: number;

  @Prop()
  acceptanceRate: number;

  @Prop()
  frequency: number;

  @Prop([
    {
      _id: false,
      input: { type: String },
      output: { type: String },
      explanation: { type: String },
    },
  ])
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];

  @Prop([String])
  hints: string[];

  @Prop([
    {
      _id: false,
      language: { type: String },
      code: { type: String },
    },
  ])
  codeSnippets: {
    language: string;
    code: string;
  }[];

  @Prop()
  sourceUrl: string;

  @Prop([
    {
      _id: false,
      params: [
        {
          name: { type: String },
          type: { type: String },
          value: { type: String },
        }
      ],
      expected: { type: String },
    }
  ])
  testcases: {
    params: {
      name: string;
      type: string;
      value: string;
    }[];
    expected: string;
  }[];
}

export const LeetCodeProblemSchema = SchemaFactory.createForClass(LeetCodeProblem);
LeetCodeProblemSchema.index({ problemId: 1 }, { unique: true });
LeetCodeProblemSchema.index({ titleSlug: 1 }, { unique: true });
LeetCodeProblemSchema.index({ difficulty: 1 });
LeetCodeProblemSchema.index({ topicTags: 1 }); 