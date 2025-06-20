import { InternalResponseType } from "@common/dtos";
import { logger } from "@modules/logger";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { SuggestQueueService } from "../services";
import { SuggestData, SuggestType } from "@modules/cv/interfaces";

@Processor("suggest-queue")
export class SuggestQueueProcessor extends WorkerHost {
    constructor(private readonly suggestQueueService: SuggestQueueService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<InternalResponseType> {
        logger.debug(`Processing suggest job ${job.id} type ${job.name}`);

        try {
            switch (job.name) {
                case SuggestType.SKILL_SUGGESTION:
                    return await this.processSkillSuggestion(job.data as SuggestData);
                default:
                    throw new Error(`Unsupported suggest type: ${job.name}`);
            }
        } catch (error) {
            logger.error(`Error processing suggest job: ${error.message}`);
            throw error;
        }
    }

    private async processSkillSuggestion(data: SuggestData): Promise<InternalResponseType> {
        logger.info(`Processing skill suggestion for user: ${data.userId}`);
        try {
            return this.suggestQueueService.handleSkillSuggestion(data);
        } catch (error) {
            logger.error(`Error handling skill suggestion: ${error.message}`);
            throw error;
        }
    }
}