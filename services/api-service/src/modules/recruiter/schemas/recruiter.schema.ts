import { BaseSchema } from "@common/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type RecruiterDocument = HydratedDocument<Recruiter>;

@Schema({ timestamps: true, versionKey: false })
export class Recruiter extends BaseSchema {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: false })
  position?: string;

  @Prop({ type: String, required: true })
  companyName: string;

  @Prop({ type: String, required: false })
  companyWebsite?: string;
}

export const RecruiterSchema = SchemaFactory.createForClass(Recruiter);

RecruiterSchema.index({ userId: 1 }, { unique: true });
