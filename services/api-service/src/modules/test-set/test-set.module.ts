import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestSetController } from './test-set.controller';
import { TestSet, TestSetSchema } from './schemas/test-set.schema';
import { TestSetRepository } from './repositories';
import { TestSetService } from './test-set.service';
import { RedisModule } from '@modules/redis';
import { QuizModule } from '@modules/quizz/quiz.module';
import { LeetCodeModule } from '@modules/leetcode/leetcode.module';
import { CVModule } from '@modules/cv/cv.module';

@Module({
  imports: [
    RedisModule,
    QuizModule,
    CVModule,
    LeetCodeModule,
    MongooseModule.forFeature([{ name: TestSet.name, schema: TestSetSchema }])
  ],
  providers: [TestSetService, TestSetRepository],
  exports: [TestSetService, TestSetRepository],
  controllers: [TestSetController],
})
export class TestSetModule { }