import { RedisModule } from "@modules/redis";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApplicationRepository, CVRepository, EvaluationRepository, JDRepository } from "./repositories";
import { Application, ApplicationSchema, CV, CVSchema, Evaluation, EvaluationSchema, JD, JDSchema } from "./schemas";
import { CVController } from "./cv.controller";
import { CVService } from "./cv.service";
import { CandidateModule } from "@modules/candidate/candidate.module";
import { MediaModule } from "@modules/media/media.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]), MongooseModule.forFeature([{ name: CV.name, schema: CVSchema }]),
    MongooseModule.forFeature([{ name: Evaluation.name, schema: EvaluationSchema }]), MongooseModule.forFeature([{ name: JD.name, schema: JDSchema }]),
    RedisModule,
    CandidateModule,
    MediaModule],
  providers: [CVService, CVRepository, ApplicationRepository, EvaluationRepository, JDRepository],
  exports: [CVService, CVRepository],
  controllers: [CVController]
})
export class CVModule { }
