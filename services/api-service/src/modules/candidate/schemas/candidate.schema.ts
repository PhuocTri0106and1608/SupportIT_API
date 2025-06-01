import { BaseInformation, BaseSchema } from "@common/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Type } from "class-transformer";
import { HydratedDocument } from "mongoose";

export type CandidateDocument = HydratedDocument<Candidate>;

@Schema({ timestamps: true, versionKey: false })
export class Candidate extends BaseSchema {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String })
  position?: string;

  @Prop({ type: BaseInformation })
  @Type(() => BaseInformation)
  information?: BaseInformation;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);

CandidateSchema.index({ userId: 1 }, { unique: true });
