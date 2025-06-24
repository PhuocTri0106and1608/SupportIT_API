import { MailerModule } from "@modules/mailer";
import { BullModule } from "@nestjs/bullmq";
import { forwardRef, Module } from "@nestjs/common";
import { CvProcessingProcessor, MailQueueProcessor, RecombeeQueueProcessor, SuggestQueueProcessor } from "./processors";
import { CvProcessingQueueService, MailQueueService, RecombeeQueueService, SuggestQueueService } from "./services";
import { RecombeeModule } from "@modules/recombee/recombee.module";
import { RedisModule } from "@modules/redis";
import { CVModule } from "@modules/cv/cv.module";

@Module({
    imports: [
        BullModule.registerQueue(
            {
                name: "mail-queue"
            }
        ),
        BullModule.registerQueue(
            {
                name: "recombee-queue"
            }
        ),
        BullModule.registerQueue(
            {
                name: "suggest-queue"
            }
        ),
        BullModule.registerQueue(
            {
                name: "cv-processing-queue"
            }
        ),
        MailerModule,
        forwardRef(() => RecombeeModule),
        forwardRef(() => CVModule),
        RedisModule
    ],
    providers: [MailQueueService, MailQueueProcessor, RecombeeQueueService, RecombeeQueueProcessor, SuggestQueueService, SuggestQueueProcessor, CvProcessingQueueService, CvProcessingProcessor],
    exports: [MailQueueService, RecombeeQueueService, SuggestQueueService, CvProcessingQueueService],
})
export class BullQueueModule {}
