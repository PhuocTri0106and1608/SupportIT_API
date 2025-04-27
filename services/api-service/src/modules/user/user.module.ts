import { BullQueueModule } from "@modules/bull-queue";
import { RedisModule } from "@modules/redis";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserRepository } from "./repositories/user.repository";
import { User, UserSchema } from "./schemas/user.schema";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { CandidateModule } from "@modules/candidate/candidate.module";
import { AdminModule } from "@modules/admin";

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), RedisModule, BullQueueModule, CandidateModule, AdminModule],
    providers: [UserService, UserRepository],
    exports: [UserService, UserRepository],
    controllers: [UserController]
})
export class UserModule {}
