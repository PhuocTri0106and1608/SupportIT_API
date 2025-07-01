import { BaseSchema } from "@common/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsString } from "class-validator";

export type EvaluationDocument = HydratedDocument<Evaluation>;

class ATSCheck {
  @IsArray()
  @IsString({ each: true })
  formatting_tips: string[];

  @IsArray()
  @IsString({ each: true })
  issues: string[];

  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @IsArray()
  @IsString({ each: true })
  missing_keywords: string[];
}

class SkillsAnalysis {
  @IsNumber()
  match_percent: number;

  @IsArray()
  @IsString({ each: true })
  matched_skills: string[];

  @IsArray()
  @IsString({ each: true })
  missing_skills: string[];
}

class Summary {
  @IsNumber()
  overall_score: number;

  @IsNumber()
  similarity_score: number;
}

@Schema({ _id: false, versionKey: false })
export class ReviewCVResponse {
  @Prop({ type: Object })
  ai_review: any;

  @Prop({ type: Object })
  @Type(() => ATSCheck)
  ats_check: ATSCheck;

  @Prop({ type: Object })
  @Type(() => SkillsAnalysis)
  skills_analysis: SkillsAnalysis;

  @Prop({ type: Object })
  @Type(() => Summary)
  summary: Summary;
}

@Schema({ timestamps: true, versionKey: false })
export class Evaluation extends BaseSchema {
  @Prop({ type: String, required: true })
  candidateId: string;

  @Prop({ type: String, required: true })
  cvId: string;

  @Prop({ type: String, required: true })
  jdId: string;

  @Prop({ type: ReviewCVResponse, required: false })
  reviewCVResponse?: ReviewCVResponse;
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);

EvaluationSchema.index({ candidateId: 1 });
