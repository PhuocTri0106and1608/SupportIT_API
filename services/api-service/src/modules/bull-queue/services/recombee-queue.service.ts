import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import {
  RecombeeJobType,
  AddJdData,
  CreateJobIdealCandidateData,
  AddCvData,
  AddCandidateData,
  AddEvaluationData,
  AddInteractionData,
  RecombeeJobData
} from "../interfaces";
import { InternalResponseType } from "@common/dtos";

@Injectable()
export class RecombeeQueueService {
  private readonly logger = new Logger(RecombeeQueueService.name)
  constructor(
    @InjectQueue("recombee-queue") private recombeeQueue: Queue
  ) { }

  private async addToQueue(
    type: RecombeeJobType,
    data: RecombeeJobData,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
      removeOnComplete?: boolean | number;
      removeOnFail?: boolean | number;
    }
  ): Promise<InternalResponseType> {
    try {
      const jobOptions = {
        priority: options?.priority || 1,
        delay: options?.delay || 0,
        attempts: options?.attempts || 5,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: options?.removeOnComplete !== undefined ? options.removeOnComplete : true,
        removeOnFail: options?.removeOnFail !== undefined ? options.removeOnFail : 50,
      };

      const job = await this.recombeeQueue.add(type, data, jobOptions);
      this.logger.log(`Recombee job ${job.id} added to queue with type: ${type}`);
      return { result: true, data: job.id };
    } catch (error) {
      this.logger.error(`Failed to add Recombee job to queue (type: ${type}): ${error.message}`, error.stack);
      return { result: false, error };
    }
  }

  async addJdToRecombee(data: AddJdData) {
    return this.addToQueue(RecombeeJobType.ADD_JD, data);
  }

  async createJobIdealCandidateInRecombee(data: CreateJobIdealCandidateData) {
    return this.addToQueue(RecombeeJobType.CREATE_JOB_IDEAL_CANDIDATE, data);
  }

  async addCvToRecombee(data: AddCvData) {
    return this.addToQueue(RecombeeJobType.ADD_CV, data);
  }

  async addCandidateToRecombee(data: AddCandidateData) {
    return this.addToQueue(RecombeeJobType.ADD_CANDIDATE, data);
  }

  async addEvaluationToRecombee(data: AddEvaluationData) {
    return this.addToQueue(RecombeeJobType.ADD_EVALUATION, data);
  }

  async addInteractionToRecombee(data: AddInteractionData) {
    return this.addToQueue(RecombeeJobType.ADD_INTERACTION, data);
  }
}