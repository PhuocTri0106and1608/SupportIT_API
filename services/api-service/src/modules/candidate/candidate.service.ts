import { CodeResponseEnum, LoginRoleEnum } from "@common/enums";
import { IAuthPayload } from "@modules/auth/interfaces";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CandidateRepository } from "./repositories";
import { CandidateDocument } from "./schemas";
import { CandidateDto } from "./dtos";

@Injectable()
export class CandidateService {

  constructor(
    private readonly candidateRepository: CandidateRepository
  ) { }

  async createOrUpdateCandidate(request: CandidateDto): Promise<CandidateDocument> {
    const { userId, cvId, appliedJobIds, testResult } = request;

    try {
      const existingCandidate = await this.candidateRepository.findOne({ userId: userId }, false);

      if (!existingCandidate) {
        const newCandidate = {
          userId: userId,
          cvId: cvId,
          appliedJobIds: appliedJobIds,
          testResult: testResult
        };

        const candidate = await this.candidateRepository.create(newCandidate) as CandidateDocument;

        return candidate;
      }

      const updatedCandidate = await this.candidateRepository.findOneAndUpdate(
        { userId: userId },
        {
          $set: {
            cvId: cvId,
            appliedJobIds: appliedJobIds,
            testResult: testResult
          }
        },
        { new: true, upsert: false },
        false
      ) as CandidateDocument;

      return updatedCandidate;
    } catch (error) {
      throw new HttpException("createCandidate error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }
}
