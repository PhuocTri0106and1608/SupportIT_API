import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { BaseSchema } from "src/common";

export type AdminLogDocument = HydratedDocument<AdminLog>;

@Schema({ versionKey: false, timestamps: true })
export class AdminLog extends BaseSchema {
    @Prop({ type: String })
    adminId: string;

    @Prop({ type: String })
    action: string;

    @Prop({ type: Object })
    body: object;

    @Prop({ type: String })
    model: string;

    @Prop({ type: String })
    currentData: string;
}

export const AdminLogSchema = SchemaFactory.createForClass(AdminLog);
AdminLogSchema.index({ deletedAt: 1, adminId: 1, action: 1 });
