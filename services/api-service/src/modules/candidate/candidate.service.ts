import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CandidateRepository } from "./repositories";
import { CandidateDocument } from "./schemas";
import { BaseInformationDto } from "@common/dtos";

@Injectable()
export class CandidateService {

  constructor(
    private readonly candidateRepository: CandidateRepository
  ) { }

  async createOrUpdateCandidate(request: { userId: string, information: BaseInformationDto }): Promise<CandidateDocument> {
    const { userId, information } = request;

    try {
      const existingCandidate = await this.candidateRepository.findOne({ userId: userId });

      if (!existingCandidate) {
        const newCandidate = {
          userId: userId,
          information
        };

        const candidate = await this.candidateRepository.create(newCandidate) as CandidateDocument;

        return candidate;
      }

      const updatedCandidate = await this.candidateRepository.findOneAndUpdate(
        { userId: userId },
        {
          $set: {
            information
          }
        },
        { new: true, upsert: false },
        false
      ) as CandidateDocument;

      return updatedCandidate;
    } catch (error) {
      throw new HttpException("createOrUpdateCandidate error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }
}
