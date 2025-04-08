import { RedisModule } from "@modules/redis";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CandidateRepository } from "./repositories";
import { Candidate, CandidateSchema } from "./schemas";
import { CandidateController } from "./candidate.controller";
import { CandidateService } from "./candidate.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Candidate.name, schema: CandidateSchema }]), RedisModule],
  providers: [CandidateService, CandidateRepository],
  exports: [CandidateService, CandidateRepository],
  controllers: [CandidateController]
})
export class CandidateModule { }
