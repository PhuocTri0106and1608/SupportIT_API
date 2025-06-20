import { MailerModule } from "@modules/mailer";
import { BullModule } from "@nestjs/bullmq";
import { forwardRef, Module } from "@nestjs/common";
import { MailQueueProcessor, RecombeeQueueProcessor, SuggestQueueProcessor } from "./processors";
import { MailQueueService, RecombeeQueueService, SuggestQueueService } from "./services";
import { RecombeeModule } from "@modules/recombee/recombee.module";
import { RedisModule } from "@modules/redis";

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
        MailerModule,
        forwardRef(() => RecombeeModule),
        RedisModule
    ],
    providers: [MailQueueService, MailQueueProcessor, RecombeeQueueService, RecombeeQueueProcessor, SuggestQueueService, SuggestQueueProcessor],
    exports: [MailQueueService, RecombeeQueueService, SuggestQueueService],
})
export class BullQueueModule {}
