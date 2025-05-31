import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { BaseSchema } from "@common/schemas";
import { Type } from "class-transformer";
import { BaseInformation } from "../../../common/schemas";

export type JDDocument = HydratedDocument<JD>;

@Schema({ timestamps: true, versionKey: false })
export class JD extends BaseSchema {
  @Prop({ required: true })
  creatorUserId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  companyName?: string;

  @Prop()
  location?: string;

  @Prop({ type: BaseInformation })
  @Type(() => BaseInformation)
  requirements: BaseInformation;

  @Prop([String])
  benefits: string[];

  @Prop({ enum: ["private", "public"], default: "private" })
  visibility?: "private" | "public";

  @Prop({ required: true, default: false })
  verified: string;
}

export const JDSchema = SchemaFactory.createForClass(JD);

JDSchema.index({ creatorUserId: 1 });