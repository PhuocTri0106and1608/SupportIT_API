import { BaseSchema } from "@common/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true, versionKey: false })
export class User extends BaseSchema {
    @Prop({ type: String, required: false, index: { sparse: true, unique: true } })
    email: string;

    @Prop({ type: String })
    name: string;

    @Prop({ type: String, nullable: true })
    avatar: string;

    @Prop({ type: String, nullable: true })
    googleAccessToken: string;

    @Prop({ type: String, nullable: true })
    googleRefreshToken: string;

    @Prop({ type: Date, default: Date.now })
    lastLoginDate: Date;

    @Prop({ type: Number, default: 0 })
    loginTime: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
