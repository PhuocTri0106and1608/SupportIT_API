import { CodeResponseEnum, LoginRoleEnum } from "@common/enums";
import { IAuthPayload } from "@modules/auth/interfaces";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { RecruiterRepository } from "./repositories";

@Injectable()
export class RecruiterService {

  constructor(
    private readonly recruiterRepository: RecruiterRepository
  ) { }

  // async createOrUpdateRecruiter(request: RecruiterDto): Promise<RecruiterDocument> {
  //   const { userId, cvId, appliedJobIds, testResult } = request;

  //   try {
  //     const existingRecruiter = await this.recruiterRepository.findOne({ userId: userId }, false);

  //     if (!existingRecruiter) {
  //       const newRecruiter = {
  //         userId: userId,
  //         cvId: cvId,
  //         appliedJobIds: appliedJobIds,
  //         testResult: testResult
  //       };

  //       const recruiter = await this.recruiterRepository.create(newRecruiter) as RecruiterDocument;

  //       return recruiter;
  //     }

  //     const updatedRecruiter = await this.recruiterRepository.findOneAndUpdate(
  //       { userId: userId },
  //       {
  //         $set: {
  //           cvId: cvId,
  //           appliedJobIds: appliedJobIds,
  //           testResult: testResult
  //         }
  //       },
  //       { new: true, upsert: false },
  //       false
  //     ) as RecruiterDocument;

  //     return updatedRecruiter;
  //   } catch (error) {
  //     throw new HttpException("createRecruiter error", HttpStatus.INTERNAL_SERVER_ERROR, {
  //       cause: error
  //     });
  //   }
  // }
}
