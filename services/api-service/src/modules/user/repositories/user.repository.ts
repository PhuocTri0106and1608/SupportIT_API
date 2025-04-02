import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { FilterQuery, Model } from "mongoose";
import { User } from "../schemas/user.schema";

@Injectable()
export class UserRepository extends BaseMongoRepository<User> {
    constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
        super(userModel);
    }

    async createUser(user: Partial<User>) {
        return this.userModel.create({ ...user });
    }

    async findAndCustomSelect(filter: FilterQuery<User>, select: { [key: string]: number }, isLean: boolean = true) {
        return isLean ? this.userModel.find(filter).select(select).lean().exec() : this.userModel.find(filter).select(select).exec();
    }
}
