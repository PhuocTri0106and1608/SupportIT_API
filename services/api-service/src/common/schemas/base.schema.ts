import { Prop } from "@nestjs/mongoose";

export abstract class BaseSchema {
    _id?: string;

    @Prop()
    createdAt?: Date;

    @Prop()
    updatedAt?: Date;

    @Prop()
    deletedAt?: Date;
}
