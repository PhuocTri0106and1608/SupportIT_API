import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { CrawlerService } from './crawler.service';
import { CrawlerController } from './crawler.controller';
import { Quiz, QuizSchema } from './schemas/quiz.schema';
import { QuizRepository } from './repositories';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }]),
  ],
  providers: [CrawlerService, QuizRepository],
  controllers: [CrawlerController],
})
export class QuizModule { }