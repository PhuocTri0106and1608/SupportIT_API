import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { CrawlerService } from './crawler.service';
import { QuizController } from './quiz.controller';
import { Quiz, QuizSchema } from './schemas/quiz.schema';
import { QuizRepository } from './repositories';
import { QuizService } from './quiz.service';
import { RedisModule } from '@modules/redis';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    RedisModule,
    MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }]),
  ],
  providers: [CrawlerService, QuizService, QuizRepository],
  exports: [CrawlerService, QuizService, QuizRepository],
  controllers: [QuizController],
})
export class QuizModule { }