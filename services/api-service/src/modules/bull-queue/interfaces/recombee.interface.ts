import { CandidateDocument } from "@modules/candidate/schemas";
import { CVDocument, EvaluationDocument, JDDocument } from "@modules/cv/schemas";

export enum RecombeeJobType {
  ADD_JD = "add-jd",
  CREATE_JOB_IDEAL_CANDIDATE = "create-job-ideal-candidate",
  ADD_CV = "add-cv",
  ADD_CANDIDATE = "add-candidate",
  ADD_EVALUATION = "add-evaluation",
  ADD_INTERACTION = "add-interaction"
}

export interface AddJdData {
  jd: JDDocument;
}

export interface CreateJobIdealCandidateData {
  jdId: string;
}

export interface AddCvData {
  cv: CVDocument;
}

export interface AddCandidateData {
  candidate: CandidateDocument;
}

export interface AddEvaluationData {
  evaluation: EvaluationDocument,
  type: "review" | "apply";
}

export interface AddInteractionData {
  userId: string;
  itemId: string;
  interactionType: string;
}

export type RecombeeJobData =
  | AddJdData
  | CreateJobIdealCandidateData
  | AddCvData
  | AddCandidateData
  | AddEvaluationData
  | AddInteractionData;