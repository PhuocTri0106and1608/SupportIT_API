import { RedisModule } from "@modules/redis";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { InterviewRepository } from "./repositories";
import { InterviewController } from "./interview.controller";
import { InterviewService } from "./interview.service";
import { Interview, InterviewSchema } from "./schemas/interview.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: Interview.name, schema: InterviewSchema }]), RedisModule],
  providers: [InterviewService, InterviewRepository],
  exports: [InterviewService, InterviewRepository],
  controllers: [InterviewController]
})
export class InterviewModule { }
