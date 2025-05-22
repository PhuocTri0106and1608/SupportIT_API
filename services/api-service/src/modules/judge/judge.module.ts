import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JudgeController } from './judge.controller';
import { JudgeService } from './judge.service';
import { SubmissionResult, SubmissionResultSchema } from './schemas';
import { SubmissionResultRepository } from './repositories';
import { LeetCodeModule } from '@modules/leetcode/leetcode.module';
import { RedisModule } from '@modules/redis';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubmissionResult.name, schema: SubmissionResultSchema },
    ]),
    LeetCodeModule,
    RedisModule
  ],
  controllers: [JudgeController],
  providers: [JudgeService, SubmissionResultRepository],
  exports: [JudgeService],
})
export class JudgeModule { } 