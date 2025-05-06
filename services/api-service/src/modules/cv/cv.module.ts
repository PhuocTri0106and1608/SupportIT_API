import { RedisModule, RedisService } from "@modules/redis";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CVRepository } from "./repositories";
import { CV, CVSchema } from "./schemas";
import { CVController } from "./cv.controller";
import { CVService } from "./cv.service";
import { CandidateModule } from "@modules/candidate/candidate.module";
import { MediaModule } from "@modules/media/media.module";

@Module({
  imports: [MongooseModule.forFeature([{ name: CV.name, schema: CVSchema }]), RedisModule, CandidateModule, MediaModule, RedisService],
  providers: [CVService, CVRepository],
  exports: [CVService, CVRepository],
  controllers: [CVController]
})
export class CVModule { }
