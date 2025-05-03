import { RedisModule } from "@modules/redis";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RecruiterRepository } from "./repositories";
import { Recruiter, RecruiterSchema } from "./schemas";
import { RecruiterController } from "./recruiter.controller";
import { RecruiterService } from "./recruiter.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Recruiter.name, schema: RecruiterSchema }]), RedisModule],
  providers: [RecruiterService, RecruiterRepository],
  exports: [RecruiterService, RecruiterRepository],
  controllers: [RecruiterController]
})
export class RecruiterModule { }
