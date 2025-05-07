import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { CrawlerService } from './crawler.service';
import { QuizController } from './quiz.controller';
import { Quiz, QuizSchema } from './schemas/quiz.schema';
import { QuizRepository, QuizSubmissionRepository } from './repositories';
import { QuizService } from './quiz.service';
import { RedisModule } from '@modules/redis';
import { QuizSubmission, QuizSubmissionSchema } from './schemas';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    RedisModule,
    MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }]),
    MongooseModule.forFeature([{ name: QuizSubmission.name, schema: QuizSubmissionSchema }])
  ],
  providers: [CrawlerService, QuizService, QuizRepository, QuizSubmissionRepository],
  exports: [CrawlerService, QuizService, QuizRepository, QuizSubmissionRepository],
  controllers: [QuizController],
})
export class QuizModule { }