import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { LeetCodeCrawlerService } from './leetcode-crawler.service';
import { LeetCodeController } from './leetcode.controller';
import { LeetCodeService } from './leetcode.service';
import { LeetCodeProblem, LeetCodeProblemSchema } from './schemas/leetcode-problem.schema';
import { LeetCodeProblemRepository } from './repositories';
import { RedisModule } from '@modules/redis/redis.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    RedisModule,
    MongooseModule.forFeature([
      { name: LeetCodeProblem.name, schema: LeetCodeProblemSchema },
    ]),
  ],
  providers: [LeetCodeCrawlerService, LeetCodeService, LeetCodeProblemRepository],
  exports: [LeetCodeCrawlerService, LeetCodeService, LeetCodeProblemRepository],
  controllers: [LeetCodeController],
})
export class LeetCodeModule { } 