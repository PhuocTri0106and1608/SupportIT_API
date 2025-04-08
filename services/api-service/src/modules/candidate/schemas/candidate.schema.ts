import { LoginRoleEnum } from "@common/enums";
import { BaseSchema } from "@common/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CandidateDocument = HydratedDocument<Candidate>;

export class TestResult {
  @Prop({ type: [String] })
  AIInterviewIds?: string[];

  @Prop({ type: [String] })
  TechnicalQuizIds?: string[];

  @Prop({ type: [String] })
  LiveCodingIds?: string[];

  @Prop({ type: [String] })
  SoftSkillsIds?: string[];
}

@Schema({ timestamps: true, versionKey: false })
export class Candidate extends BaseSchema {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, nullable: true })
  cvId?: string;

  @Prop({ type: [String] })
  appliedJobIds?: string[];

  @Prop({ type: TestResult })
  testResult?: TestResult;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);

CandidateSchema.index({ userId: 1 }, { unique: true });
