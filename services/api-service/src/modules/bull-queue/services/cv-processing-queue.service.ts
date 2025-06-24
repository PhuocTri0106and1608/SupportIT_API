// cv-processing-queue.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { CvProcessingJobType, ProcessReviewData } from "../interfaces";

@Injectable()
export class CvProcessingQueueService {
  private readonly logger = new Logger(CvProcessingQueueService.name);

  constructor(@InjectQueue("cv-processing-queue") private cvProcessingQueue: Queue) { }

  async addToQueue(
    type: CvProcessingJobType,
    data: ProcessReviewData,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
      removeOnComplete?: boolean | number;
      removeOnFail?: boolean | number;
    }
  ): Promise<any> {
    try {
      const jobOptions = {
        priority: options?.priority || 1,
        delay: options?.delay || 0,
        attempts: options?.attempts || 3,
        removeOnComplete: options?.removeOnComplete !== undefined ? options.removeOnComplete : true,
        removeOnFail: options?.removeOnFail !== undefined ? options.removeOnFail : 50,
      };

      const job = await this.cvProcessingQueue.add(
        CvProcessingJobType.APPLY_CV,
        data,
        jobOptions
      );
      this.logger.log(
        `CV Processing job ${job.id} added to queue for CV ${data.cvData._id.toString()} and JD ${data.jdData._id.toString() } for user ${data.userId}`
      );
      return { result: true, jobId: job.id };
    } catch (error) {
      this.logger.error(
        `Failed to add CV Processing job to queue for CV ${data.cvData._id.toString()}: ${error.message}`,
        error.stack
      );
      return { result: false, error };
    }
  }
}