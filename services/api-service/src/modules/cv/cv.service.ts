import { CodeResponseEnum, LoginRoleEnum } from "@common/enums";
import { IAuthPayload } from "@modules/auth/interfaces";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CVRepository } from "./repositories";
import { CVDocument } from "./schemas";
import { CVDto } from "./dtos";
import axios from "axios";
import { ResponseType } from "@common/dtos";
import { CandidateRepository } from "@modules/candidate/repositories";
import { Types } from "mongoose";
import { env } from "@environments";
@Injectable()
export class CVService {

  constructor(
    private readonly CVRepository: CVRepository,
    private readonly candidateRepository: CandidateRepository
  ) { }

  async saveCV(request: { cv: CVDto, userId: string }): Promise<ResponseType<CVDocument>> {
    const { cv, userId } = request;
    const { fileUrl, jobDescription } = cv;

    try {
      const candidate = await this.candidateRepository.findOne({ userId: userId });

      const response = await axios.post(`${env.flask.REVIEW_CV_URL}`, {
        cv_url: fileUrl,
        job_description: jobDescription
      });
      if (!response || !response.data) {
        throw new HttpException("Error in review CV", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const reviewCVResponse = response.data;

      const cv = await this.CVRepository.create({
        candidateId: candidate._id,
        fileUrl,
        jobDescription,
        reviewCVResponse
      });

      await this.candidateRepository.findOneAndUpdate({
        _id: new Types.ObjectId(candidate._id)
      }, {
        $set: {
          cvId: cv._id.toString()
        }
      });

      return {
        code: CodeResponseEnum.SUCCESS,
        data: cv as CVDocument
      };
    } catch (error) {
      throw new HttpException("saveCV error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }
}
