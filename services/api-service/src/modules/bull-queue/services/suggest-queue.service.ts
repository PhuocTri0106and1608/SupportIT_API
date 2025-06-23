import { InternalResponseType } from "@common/dtos";
import { logger } from "@modules/logger";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import axios from "axios";
import { RedisService } from "@modules/redis";
import { env } from "@environments";
import { SuggestData, SuggestedResponse, SuggestType } from "@modules/cv/interfaces";

@Injectable()
export class SuggestQueueService {
    constructor(
        @InjectQueue("suggest-queue") private suggestQueue: Queue,
        private readonly redisService: RedisService,
    ) { }

    async addToQueue(
        type: SuggestType,
        data: SuggestData,
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

            const job = await this.suggestQueue.add(type, data, jobOptions);
            logger.info(`Suggest job ${job.id} added to queue with type: ${type} for userId: ${data.userId}`);

            return {
                result: true
            };
        } catch (error) {
            logger.error(`Failed to add suggest job to queue: ${error.message}`);
            return {
                result: false,
                error: error
            };
        }
    }

    async handleSkillSuggestion(data: SuggestData): Promise<InternalResponseType> {
        const { userId, requestedSkills } = data;
        logger.info(`Fetching suggestions from Flask for userId: ${userId}`);
        try {
            const cachedSuggestions = await this.redisService.get(`suggest:userId:${userId}`);
            if (cachedSuggestions) {
                logger.info(`Returning cached suggestions for userId: ${userId}`);
                return { result: true, data: cachedSuggestions as SuggestedResponse };
            }

            const suggestResponse = await axios.post(`${env.flask.SUGGEST_URL}`, requestedSkills);

            if (!suggestResponse?.data || !suggestResponse.data?.suggested_problems || !suggestResponse.data?.suggested_quizzes || suggestResponse.data?.suggested_problems.length === 0 || suggestResponse.data?.suggested_quizzes.length === 0) {
                logger.error("Error in handleSkillSuggestion: No data or empty arrays returned from suggest API");
                return { result: false, error: "No suggestions found or invalid data from external API" };
            } else {
                const suggestedProblems = suggestResponse.data.suggested_problems;
                const suggestedQuizzes = suggestResponse.data.suggested_quizzes;

                await this.redisService.set(`suggest:userId:${userId}`, { suggested_problems: suggestedProblems, suggested_quizzes: suggestedQuizzes } as SuggestedResponse, { ttl: 60 * 60 * 24 * 7 }); // Cache for 7 days
                logger.info(`Successfully stored suggestions for userId: ${userId}`);
                return { result: true };
            }
        } catch (error) {
            logger.error(`Error fetching or storing suggestions for userId ${userId}: ${error.message}`);
            throw error;
        }
    }
}