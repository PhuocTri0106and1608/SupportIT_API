import { InterviewLevel, InterviewPosition } from "@common/enums";
import { BaseSchema } from "@common/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type InterviewDocument = HydratedDocument<Interview>;

export class QuestionSet {
  @Prop({ type: String })
  question: string;

  @Prop({ type: String })
  answer: string;
}

@Schema({ timestamps: true, versionKey: false })
export class Interview extends BaseSchema {
  @Prop({ type: String, required: true })
  level: InterviewLevel;

  @Prop({ type: String, required: true })
  position: InterviewPosition;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, nullable: true })
  jobId?: string;

  @Prop({ type: [QuestionSet] })
  questionSet: QuestionSet[];
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);

InterviewSchema.index({ level: 1, position: 1, type: 1, jobId: 1 });
