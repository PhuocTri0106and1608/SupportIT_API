import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AdminLog, AdminLogDocument } from "../schemas/admin-log.schema";

@Injectable()
export class AdminLogService {
    constructor(@InjectModel(AdminLog.name) private readonly adminLogModel: Model<AdminLogDocument>) {}

    async createLog(data: { adminId: string; action: string; body: object; model: string; currentData: string }): Promise<void> {
        try {
            await this.adminLogModel.create(data);
        } catch (error) {
            console.error("Error creating admin log:", error);
        }
    }
}
