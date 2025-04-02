import { MailerModule } from "@modules/mailer";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { MailQueueProcessor } from "./processors";
import { MailQueueService } from "./services";

@Module({
    imports: [
        BullModule.registerQueue(
            {
                name: "mail-queue"
            }
        ),
        MailerModule
    ],
    providers: [MailQueueService, MailQueueProcessor],
    exports: [MailQueueService]
})
export class BullQueueModule {}
