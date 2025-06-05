import { Module } from '@nestjs/common';
import { RecombeeService } from './recombee.service';
import { RecombeeController } from './recombee.controller';
import { CVModule } from '@modules/cv/cv.module';
import { CandidateModule } from '@modules/candidate/candidate.module';
import { RedisModule } from '@modules/redis';

@Module({
  providers: [RecombeeService],
  controllers: [RecombeeController],
  exports: [RecombeeService],
  imports: [CVModule, CandidateModule, RedisModule]
})
export class RecombeeModule { }
