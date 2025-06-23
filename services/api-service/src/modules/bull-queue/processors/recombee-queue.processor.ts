
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { RecombeeService } from "@modules/recombee/recombee.service";
import {
  RecombeeJobType,
  AddJdData,
  CreateJobIdealCandidateData,
  AddCvData,
  AddCandidateData,
  AddEvaluationData,
  AddInteractionData
} from "../interfaces";
import { forwardRef, Inject, Logger } from "@nestjs/common";

@Processor("recombee-queue")
export class RecombeeQueueProcessor extends WorkerHost {
  private readonly logger = new Logger("RecombeeQueueProcessor");
  constructor(
    @Inject(forwardRef(() => RecombeeService))
    private readonly recombeeService: RecombeeService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing Recombee job ${job.id} of type ${job.name}`);

    try {
      switch (job.name as RecombeeJobType) {
        case RecombeeJobType.ADD_JD:
          return this.handleAddJd(job.data as AddJdData);
        case RecombeeJobType.CREATE_JOB_IDEAL_CANDIDATE:
          return this.handleCreateJobIdealCandidate(job.data as CreateJobIdealCandidateData);
        case RecombeeJobType.ADD_CV:
          return this.handleAddCv(job.data as AddCvData);
        case RecombeeJobType.ADD_CANDIDATE:
          return this.handleAddCandidate(job.data as AddCandidateData);
        case RecombeeJobType.ADD_EVALUATION:
          return this.handleAddEvaluation(job.data as AddEvaluationData);
        case RecombeeJobType.ADD_INTERACTION:
          return this.handleAddInteraction(job.data as AddInteractionData);
        default:
          this.logger.warn(`Unsupported Recombee job type: ${job.name}`);
          throw new Error(`Unsupported Recombee job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Error processing Recombee job ${job.id} (type: ${job.name}): ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleAddJd(data: AddJdData) {
    this.logger.log(`Executing Recombee: Add JD for JD id ${data.jd._id.toString()}`);
    return this.recombeeService.addJD(data.jd);
  }

  private async handleCreateJobIdealCandidate(data: CreateJobIdealCandidateData) {
    this.logger.log(`Executing Recombee: Create Job Ideal Candidate for JD ID ${data.jdId}`);
    return this.recombeeService.createJobIdealCandidate(data.jdId);
  }

  private async handleAddCv(data: AddCvData) {
    this.logger.log(`Executing Recombee: Add CV for CV id ${data.cv._id.toString()}`);
    return this.recombeeService.addCV(data.cv);
  }

  private async handleAddCandidate(data: AddCandidateData) {
    this.logger.log(`Executing Recombee: Add Candidate for Candidate id ${data.candidate.userId}`);
    return this.recombeeService.addCandidate(data.candidate);
  }

  private async handleAddEvaluation(data: AddEvaluationData) {
    this.logger.log(`Executing Recombee: Add Evaluation for Evaluation id ${data.evaluation._id.toString()}`);
    if (data.type === "apply") await this.handleAddInteraction({
      userId: data.evaluation.candidateId,
      itemId: data.evaluation.jdId,
      interactionType: "apply"
    });
    return this.recombeeService.addEvaluation(data.evaluation);
  }

  private async handleAddInteraction(data: AddInteractionData) {
    this.logger.log(`Executing Recombee: Add Interaction for User ${data.userId} on Item ${data.itemId}`);
    return this.recombeeService.addInteraction(data.userId, data.itemId, data.interactionType);
  }
}