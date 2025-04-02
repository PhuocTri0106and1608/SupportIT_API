import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Admin, AdminDocument } from "../schemas";

@Injectable()
export class AdminRepository extends BaseMongoRepository<AdminDocument> {
    constructor(
        @InjectModel(Admin.name)
        private readonly adminModel: Model<AdminDocument>
    ) {
        super(adminModel);
    }
}
