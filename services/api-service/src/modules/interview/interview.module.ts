import { RedisModule } from "@modules/redis";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { InterviewController } from "./interview.controller";
import { InterviewService } from "./interview.service";
import { InterviewAnswerRepository, InterviewQuestionRepository, InterviewResultRepository } from "./repositories";
import { InterviewAnswer, InterviewAnswerSchema, InterviewQuestion, InterviewQuestionSchema, InterviewResult, InterviewResultSchema } from "./schemas";

@Module({
  imports: [MongooseModule.forFeature([{ name: InterviewAnswer.name, schema: InterviewAnswerSchema }]), 
  MongooseModule.forFeature([{ name: InterviewResult.name, schema: InterviewResultSchema }]),
  MongooseModule.forFeature([{ name: InterviewQuestion.name, schema: InterviewQuestionSchema }]), RedisModule],
  providers: [InterviewService, InterviewAnswerRepository, InterviewResultRepository, InterviewQuestionRepository],
  exports: [InterviewService, InterviewAnswerRepository, InterviewResultRepository, InterviewQuestionRepository],
  controllers: [InterviewController]
})
export class InterviewModule { }
