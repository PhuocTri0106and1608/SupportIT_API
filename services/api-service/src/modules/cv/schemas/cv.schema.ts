import { BaseSchema } from "@common/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CVDocument = HydratedDocument<CV>;

export class ExperienceFeedback {
  @Prop({ type: String })
  exp_snippet: string;

  @Prop({ type: Number })
  score: number;

  @Prop({ type: String })
  suggestion: string;
}

export class SkillMatch {
  @Prop({ type: Number })
  match_percent: number;

  @Prop({ type: [String] })
  matched_skills: string[];

  @Prop({ type: [String] })
  missing_skills: string[];
}

export class Summary {
  @Prop({ type: String })
  match_status: string;

  @Prop({ type: Number })
  similarity_score: number;

  @Prop({ type: Number })
  skill_match_percent: number;
}

export class ReviewCVResponse {
  @Prop({ type: String })
  review: string;

  @Prop({ type: [ExperienceFeedback] })
  experience_feedback: ExperienceFeedback[];

  @Prop({ type: SkillMatch })
  skill_match: SkillMatch;

  @Prop({ type: Summary })
  summary: Summary;
}


@Schema({ timestamps: true, versionKey: false })
export class CV extends BaseSchema {
  @Prop({ type: String, required: true })
  candidateId: string;

  @Prop({ type: String, required: true })
  fileUrl: string;

  @Prop({ type: String, required: true })
  jobDescription: string;

  @Prop({ type: ReviewCVResponse, required: true })
  reviewCVResponse: ReviewCVResponse;
}

export const CVSchema = SchemaFactory.createForClass(CV);

CVSchema.index({ candidateId: 1 });
