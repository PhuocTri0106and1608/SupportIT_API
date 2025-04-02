import { InternalResponseType } from "@common/dtos";
import { logger } from "@modules/logger";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { EmailType, MailQueueService, OtpEmailData } from "../services/mail-queue.service";

@Processor("mail-queue")
export class MailQueueProcessor extends WorkerHost {
    constructor(private readonly mailQueueService: MailQueueService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<InternalResponseType> {
        logger.debug(`Processing job ${job.id} type ${job.name}`);

        try {
            switch (job.name) {
                case EmailType.OTP:
                    return await this.processOtpEmail(job.data as OtpEmailData);
                default:
                    throw new Error(`Unsupported email type: ${job.name}`);
            }
        } catch (error) {
            logger.error(`Error processing email job: ${error.message}`);
            throw error;
        }
    }

    private async processOtpEmail(data: OtpEmailData): Promise<InternalResponseType> {
        logger.info(`Sending OTP email to ${data.to}`);
        try {
            return this.mailQueueService.handleOtpEmail(data);
        } catch (error) {
            logger.error(`Error sending OTP email: ${error.message}`);
            throw error;
        }
    }
}
