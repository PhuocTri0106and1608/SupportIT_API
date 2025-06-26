import { InterviewType } from "@common/enums";
import { BaseSchema } from "@common/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type InterviewQuestionDocument = HydratedDocument<InterviewQuestion>;

export class RubricTemplateScore {
    @Prop({ type: Number })
    value: number;

    @Prop({ type: String })
    label: string;
}
export class RubricTemplate {
    @Prop({ type: String })
    name: string;

    @Prop({ type: [RubricTemplateScore] })
    scores: RubricTemplateScore[];
}

@Schema({ timestamps: true, versionKey: false })
export class InterviewQuestion extends BaseSchema {
    @Prop({ type: String, nullable: true })
    creatorUserId?: string;

    @Prop({ type: String, nullable: true })
    jdId?: string;

    @Prop({ type: String, required: true })
    type: InterviewType;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: [String], required: true })
    expectedKeywords: string[];

    @Prop({ type: [RubricTemplate], required: true })
    rubric: RubricTemplate[];
}

export const InterviewQuestionSchema = SchemaFactory.createForClass(InterviewQuestion);

InterviewQuestionSchema.index({ creatorUserId: 1, jdId: 1, type: 1, name: 1, expectedKeyword: 1 });
