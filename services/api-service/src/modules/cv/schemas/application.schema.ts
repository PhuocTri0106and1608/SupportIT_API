import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { BaseSchema } from "@common/schemas";

export type ApplicationDocument = HydratedDocument<Application>;

@Schema({ timestamps: true, versionKey: false })
export class Application extends BaseSchema {
  @Prop({ required: true })
  candidateId: string;

  @Prop({ required: true })
  cvId: string;

  @Prop({ required: true })
  jdId: string;

  @Prop({ type: String })
  evaluationId: string;

  @Prop({ required: true, enum: ["pending", "shortlisted", "rejected", "accepted"] })
  status: "pending" | "shortlisted" | "rejected" | "accepted";
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
ApplicationSchema.index({ candidateId: 1, cvId: 1, jdId: 1 });