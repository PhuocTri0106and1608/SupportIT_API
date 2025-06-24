// cv-processing.processor.ts
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { forwardRef, Inject, Logger } from "@nestjs/common";
import axios from "axios";

import { CvProcessingJobType, ProcessReviewData, SuggestType } from "../interfaces";
import { ApplicationRepository, EvaluationRepository } from "@modules/cv/repositories";
import { env } from "@environments";
import { Types } from "mongoose";
import { RecombeeQueueService, SuggestQueueService } from "../services";

@Processor("cv-processing-queue")
export class CvProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger("CvProcessingProcessor");

  constructor(
    @Inject(forwardRef(() => EvaluationRepository))
    private readonly evaluationRepository: EvaluationRepository,
    @Inject(forwardRef(() => ApplicationRepository))
    private readonly applicationRepository: ApplicationRepository,
    private readonly suggestQueueService: SuggestQueueService,
    private readonly recombeeQueueService: RecombeeQueueService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing CV Processing job ${job.id} of type ${job.name}`);

    try {
      switch (job.name as CvProcessingJobType) {
        case CvProcessingJobType.APPLY_CV:
          return this.handleProcessReview(job.data as ProcessReviewData);
        default:
          this.logger.warn(`Unsupported CV Processing job type: ${job.name}`);
          throw new Error(`Unsupported CV Processing job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing CV Processing job ${job.id} (type: ${job.name}): ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private async handleProcessReview(data: ProcessReviewData) {
    this.logger.log(
      `Executing CV Processing: Reviewing CV ${data.cvData._id.toString()} against JD ${data.jdData._id.toString()} for user ${data.userId}`
    );

    const { userId, cvData, jdData, applicationId } = data;

    try {
      const response = await axios.post(`${env.flask.REVIEW_CV_URL}`, {
        cv: {
          position: cvData.position,
          experience: cvData.information.experience || [],
          skills: cvData.information.skills || [],
          education: cvData.information.education || [],
          projects: cvData.information.projects || [],
          certifications: cvData.information.certifications || [],
          languages: cvData.information.languages || [],
        },
        jd: {
          title: jdData.title,
          description: jdData.description,
          position: jdData.position,
          requirements: {
            experience: jdData.requirements.experience || [],
            skills: jdData.requirements.skills || [],
            education: jdData.requirements.education || [],
            projects: jdData.requirements.projects || [],
            summary: jdData.requirements.summary || "",
            certifications: jdData.requirements.certifications || [],
            languages: jdData.requirements.languages || [],
          },
          benefits: jdData.benefits || [],
          companyName: jdData.companyName || "",
          location: jdData.location || "",
        },
      });

      if (!response?.data) {
        throw new Error("No data received from Flask API");
      }

      const reviewCVResponse = response.data;

      const evaluation = await this.evaluationRepository.create({
        candidateId: userId,
        cvId: cvData._id.toString(),
        jdId: jdData._id.toString(),
        reviewCVResponse
      });

      const requestedSkills = {
        matched_skills: reviewCVResponse.skills_analysis.matched_skills,
        missing_skills: reviewCVResponse.skills_analysis.missing_skills
      };
      const evaluationDataForQueue = JSON.parse(JSON.stringify(evaluation));

      Promise.allSettled([
        this.suggestQueueService.addToQueue(
          SuggestType.SKILL_SUGGESTION,
          { userId, requestedSkills }
        ),
        this.recombeeQueueService.addEvaluationToRecombee({ evaluation: evaluationDataForQueue, type: 'apply' }),
        this.applicationRepository.findOneAndUpdate({ _id: new Types.ObjectId(applicationId) }, {
          overallScore: reviewCVResponse.summary.overall_score,
          evaluationId: evaluation._id.toString(),
        })
      ]).catch(err => {
        console.error("Error when adding to queues in applyCV:", err);
      });

      this.logger.log(
        `Evaluation created for CV ${cvData._id.toString()}, JD ${jdData._id.toString()} with ID: ${evaluation._id.toString()}`
      );

      return { success: true, evaluationId: evaluation._id };
    } catch (error) {
      this.logger.error(
        `Error during Flask API call or evaluation creation for CV ${cvData._id.toString()}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}