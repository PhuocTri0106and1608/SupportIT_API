import { InternalResponseType } from "@common/dtos";
import { logger } from "@modules/logger";
import { MailerService } from "@modules/mailer";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export enum EmailType {
    OTP = "otp"
}

export interface OtpEmailData {
    to: string;
    otp: string;
}

@Injectable()
export class MailQueueService {
    constructor(
        @InjectQueue("mail-queue") private mailQueue: Queue,
        private readonly mailerService: MailerService
    ) {}

    async addToQueue(
        type: EmailType,
        data: OtpEmailData,
        options?: {
            priority?: number;
            delay?: number;
            attempts?: number;
            removeOnComplete?: boolean | number;
            removeOnFail?: boolean | number;
        }
    ): Promise<{ result: boolean; error?: any }> {
        try {
            const jobOptions = {
                priority: options?.priority || 1,
                delay: options?.delay || 0,
                attempts: options?.attempts || 3,
                removeOnComplete: options?.removeOnComplete !== undefined ? options.removeOnComplete : true,
                removeOnFail: options?.removeOnFail !== undefined ? options.removeOnFail : false
            };

            const job = await this.mailQueue.add(type, data, jobOptions);
            logger.info(`Email job ${job.id} added to queue with type: ${type}`);

            return {
                result: true
            };
        } catch (error) {
            logger.error(`Failed to add email job to queue: ${error.message}`);
            return {
                result: false,
                error: error
            };
        }
    }

    async addBulkToQueue(type: EmailType, dataArray: Array<OtpEmailData>) {
        try {
            const jobs = dataArray.map((data) => ({
                name: type,
                data,
                opts: {
                    priority: 1,
                    attempts: 3,
                    removeOnComplete: true,
                    removeOnFail: false
                }
            }));

            const result = await this.mailQueue.addBulk(jobs);
            logger.info(`Added ${result.length} bulk email jobs to queue with type: ${type}`);

            return true;
        } catch (error) {
            logger.error(`Failed to add bulk email jobs to queue: ${error.message}`);
            return false;
        }
    }

    async handleOtpEmail(data: OtpEmailData): Promise<InternalResponseType> {
        return this.mailerService.sendOtpEmail({ email: data.to }, data.otp);
    }
}
