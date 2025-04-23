import { BaseSchema } from "@common/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export type CVDocument = HydratedDocument<CV>;

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
  @IsString()
  fit_level: string;

  @IsNumber()
  similarity_score: number;
}

@Schema({ _id: false, versionKey: false })
export class ReviewCVResponse {
  @Prop({ type: String })
  ai_review: string;

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
