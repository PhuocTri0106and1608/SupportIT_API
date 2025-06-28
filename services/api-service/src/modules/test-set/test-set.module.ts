import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestSetController } from './test-set.controller';
import { TestSet, TestSetSchema } from './schemas/test-set.schema';
import { TestSetRepository, TestSetResultRepository } from './repositories';
import { RedisModule } from '@modules/redis';
import { QuizModule } from '@modules/quizz/quiz.module';
import { LeetCodeModule } from '@modules/leetcode/leetcode.module';
import { CVModule } from '@modules/cv/cv.module';
import { TestSetResultService, TestSetService } from './services';
import { JudgeModule } from '@modules/judge/judge.module';
import { TestSetResult, TestSetResultSchema } from './schemas';

@Module({
  imports: [
    RedisModule,
    QuizModule,
    forwardRef(() => CVModule),
    LeetCodeModule,
    JudgeModule,
    MongooseModule.forFeature([{ name: TestSet.name, schema: TestSetSchema }]),
    MongooseModule.forFeature([{ name: TestSetResult.name, schema: TestSetResultSchema }])
  ],
  providers: [TestSetService, TestSetRepository, TestSetResultRepository, TestSetResultService],
  exports: [TestSetService, TestSetRepository, TestSetResultRepository, TestSetResultService],
  controllers: [TestSetController],
})
export class TestSetModule { }