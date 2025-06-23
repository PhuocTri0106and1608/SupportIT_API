import { CV, JD } from "@modules/cv/schemas";

export enum CvProcessingJobType{
  REVIEW_CV = "review_cv",
  APPLY_CV = "apply_cv",
}


export interface ProcessReviewData {
  userId: string;
  cvData: CV;
  jdData: JD;
  applicationId: string;
}