import { MailerModule } from "@modules/mailer";
import { BullModule } from "@nestjs/bullmq";
import { forwardRef, Module } from "@nestjs/common";
import { MailQueueProcessor, RecombeeQueueProcessor } from "./processors";
import { MailQueueService, RecombeeQueueService } from "./services";
import { RecombeeModule } from "@modules/recombee/recombee.module";

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
        MailerModule,
        forwardRef(() => RecombeeModule)
    ],
    providers: [MailQueueService, MailQueueProcessor, RecombeeQueueService, RecombeeQueueProcessor],
    exports: [MailQueueService, RecombeeQueueService]
})
export class BullQueueModule {}
