import { BaseSchema } from "@common/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type AdminDocument = HydratedDocument<Admin>;

export class Permission {
    @Prop({ type: String })
    subject: string;

    @Prop({ type: String })
    action: string;

    @Prop({ type: Object })
    condition?: object;
}

@Schema({ versionKey: false, timestamps: true })
export class Admin extends BaseSchema {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true })
    email: string;

    @Prop({ type: String, required: true })
    password: string;

    @Prop({ type: String, required: true })
    phoneNumber: string;

    @Prop({ type: [Permission], default: [] })
    permissions: Permission[];
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
AdminSchema.index({ deletedAt: 1, name: 1 });
