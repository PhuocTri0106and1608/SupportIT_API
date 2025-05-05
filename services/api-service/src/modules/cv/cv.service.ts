import { CodeResponseEnum, LoginRoleEnum } from "@common/enums";
import { IAuthPayload } from "@modules/auth/interfaces";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ApplicationRepository, CVRepository, EvaluationRepository, JDRepository } from "./repositories";
import { CVDocument, JDDocument } from "./schemas";
import { CVDto, CVUploadDto, JDCreateDto } from "./dtos";
import axios from "axios";
import { ResponseType } from "@common/dtos";
import { CandidateRepository } from "@modules/candidate/repositories";
import { Types } from "mongoose";
import { env } from "@environments";
@Injectable()
export class CVService {

  constructor(
    private readonly CVRepository: CVRepository,
    private readonly jdRepository: JDRepository,
    private readonly evaluationRepository: EvaluationRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly candidateRepository: CandidateRepository
  ) { }

  async uploadJD(request: { jd: JDCreateDto, userId: string }): Promise<ResponseType> {
    const { jd, userId } = request;

    try {
      // Call Flask API to extract information from CV
      const response = await axios.post(`${env.flask.EXTRACT_JD_URL}`, {
        file_url: jd.fileUrl
      });

      if (!response?.data) {
        throw new HttpException("Error in extracting CV", HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const extractJDResponse = response.data;
      const createdJD = await this.jdRepository.create({
        creatorUserId: userId,
        title: extractJDResponse.title,
        description: extractJDResponse.description,
        companyName: extractJDResponse.companyName,
        location: extractJDResponse.location,
        requirements: extractJDResponse.requirements,
        benefits: extractJDResponse.benefits,
        visibility: jd.visibility || "private",
      });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: createdJD,
      };
    } catch (error) {
      throw new HttpException("uploadJD error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async uploadCV(request: { cv: CVUploadDto, userId: string }): Promise<ResponseType> {
    const { cv, userId } = request;

    try {
      const candidate = await this.candidateRepository.findOne({ userId });
      if (!candidate) throw new HttpException("Candidate not found", HttpStatus.NOT_FOUND);

      // Call Flask API to extract information from CV
      const response = await axios.post(`${env.flask.EXTRACT_CV_URL}`, {
        file_url: cv.fileUrl
      });

      if (!response?.data) {
        throw new HttpException("Error in extracting CV", HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const extractCVResponse = response.data;

      const createdCV = await this.CVRepository.create({
        candidateId: candidate._id,
        fileUrl: cv.fileUrl,
        fileName: cv.fileName,
        information: extractCVResponse,
      });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: createdCV,
      };
    } catch (error) {
      throw new HttpException("uploadCV error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }



  async reviewCV(request: { userId: string, cvId: string, jdId: string }): Promise<ResponseType> {
    const { userId, cvId, jdId } = request;

    try {
      const candidate = await this.candidateRepository.findOne({ userId });
      if (!candidate) throw new HttpException("Candidate not found", HttpStatus.NOT_FOUND);

      const cv = await this.CVRepository.findById(cvId);
      const jd = await this.jdRepository.findById(jdId);

      if (!cv || !jd) {
        throw new HttpException("CV or JD not found", HttpStatus.NOT_FOUND);
      }

      // Call Flask API to evaluate CV against JD
      const response = await axios.post(`${env.flask.REVIEW_CV_URL}`, {
        cv: {
          experience: cv.information.experience,
          skills: cv.information.skills,
          education: cv.information.education,
          projects: cv.information.projects,
          certifications: cv.information.certifications,
          languages: cv.information.languages
        },
        jd: {
          requirements: {
            skills: jd.requirements.skills,
            details: jd.requirements.details,
          }
        }
      });

      if (!response?.data) {
        throw new HttpException("Error in reviewing CV", HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const reviewCVResponse = response.data;

      // Create Evaluation
      const evaluation = await this.evaluationRepository.create({
        candidateId: candidate._id,
        cvId,
        jdId,
        reviewCVResponse,
      });

      // Update CV with evaluationId
      await this.CVRepository.findOneAndUpdate(
        { _id: cvId },
        { $push: { listEvaluationIds: evaluation._id.toString() } },
      );

      // Create Application
      const application = await this.applicationRepository.create({
        candidateId: candidate._id,
        cvId,
        jdId,
        evaluationId: evaluation._id.toString(),
        status: "pending",
      });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: application,
      };
    } catch (error) {
      throw new HttpException("reviewCV error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }


}
