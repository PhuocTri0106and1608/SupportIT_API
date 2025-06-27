import { BaseSchema } from '@common/schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Định nghĩa cấu trúc cho điểm chi tiết theo từng tiêu chí
class CriterionScoreDetail {
  @Prop({ required: true })
  name: string; // Tên của tiêu chí (ví dụ: "analysis")

  @Prop({ required: true })
  score: number; // Điểm cho tiêu chí này
}

// Định nghĩa cấu trúc cho kết quả phân tích AI (tùy chọn)
class AiAnalysisResult {
  @Prop({ type: [String], default: [] })
  identifiedKeywords?: string[]; // Các từ khóa AI nhận diện

  @Prop({ type: String, nullable: true })
  sentiment?: string; // Sắc thái (e.g., 'positive', 'negative', 'neutral')

  @Prop({ type: String, nullable: true })
  overallSuggestion?: string; // Gợi ý tổng quát từ AI
  
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
      criterionScores: [CriterionScoreDetail],
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

  @Prop({ type: AiAnalysisResult, nullable: true })
  aiAnalysis?: AiAnalysisResult;
}

export const InterviewAnswerSchema = SchemaFactory.createForClass(InterviewAnswer);
InterviewAnswerSchema.index({ jdId: 1, questionId: 1, candidateId: 1 }, { unique: true });
InterviewAnswerSchema.index({ evaluatorUserId: 1, submittedAt: 1, overallQuestionScore: -1 });