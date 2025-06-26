import { BaseSchema } from '@common/schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Bạn giữ nguyên các lớp này như là các interface hoặc class thuần túy
// KHÔNG thêm @Schema() cho chúng nếu bạn không muốn chúng là schema riêng
class CriterionScoreDetail {
  name: string;
  score: number;
}

class AiAnalysisResult {
  identifiedKeywords?: string[];
  sentiment?: string;
  overallSuggestion?: string;
}

export type InterviewAnswerDocument = HydratedDocument<InterviewAnswer>;

@Schema({ timestamps: true, versionKey: false })
export class InterviewAnswer extends BaseSchema {
  @Prop({ type: String, required: true, index: true })
  jdId: string;

  @Prop({ type: String, required: true, index: true })
  questionId: string;

  @Prop({ type: String, required: true, index: true })
  candidateId: string;

  @Prop({ type: String, nullable: true })
  answerContentText?: string;

  @Prop({ type: String, nullable: true })
  answerContentUrl?: string;

  @Prop({ type: Date, required: true, default: Date.now })
  submittedAt: Date;

  @Prop({
    type: {
      criterionScores: [{
        name: { type: String, required: true },
        score: { type: Number, required: true }
      }],
      totalScoreForQuestion: { type: Number, nullable: true },
      feedbackComments: { type: String, nullable: true },
    },
    nullable: true,
  })
  evaluatedScoreDetails?: {
    criterionScores: CriterionScoreDetail[];
    totalScoreForQuestion?: number;
    feedbackComments?: string;
  };

  @Prop({ type: Number, nullable: true })
  overallQuestionScore?: number;

  @Prop({ type: String, nullable: true })
  evaluatorUserId?: string;

  @Prop({ type: Date, nullable: true })
  evaluatedAt?: Date;

  @Prop({
    type: {
      identifiedKeywords: { type: [String], default: [] },
      sentiment: { type: String, nullable: true },
      overallSuggestion: { type: String, nullable: true },
    },
    nullable: true,
  })
  aiAnalysis?: AiAnalysisResult;
}

export const InterviewAnswerSchema = SchemaFactory.createForClass(InterviewAnswer);
InterviewAnswerSchema.index({ jdId: 1, questionId: 1, candidateId: 1 }, { unique: true });
InterviewAnswerSchema.index({ evaluatorUserId: 1, submittedAt: 1, overallQuestionScore: -1 });