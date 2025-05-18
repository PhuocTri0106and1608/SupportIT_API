import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { BaseSchema } from "@common/schemas";
import { Type } from "class-transformer";
import { BaseInformation } from "./base-information.schema";

export type CVDocument = HydratedDocument<CV>;

@Schema({ timestamps: true, versionKey: false })
export class CV extends BaseSchema {
  @Prop({ required: true })
  candidateId: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop()
  fileName?: string;

  @Prop({ type: BaseInformation })
  @Type(() => BaseInformation)
  information?: BaseInformation;
}

export const CVSchema = SchemaFactory.createForClass(CV);

CVSchema.index({ candidateId: 1 });