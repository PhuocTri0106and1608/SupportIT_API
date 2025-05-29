import { CodeResponseEnum, LoginRoleEnum } from "@common/enums";
import { IAuthPayload } from "@modules/auth/interfaces";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { RecruiterRepository } from "./repositories";
import { Recruiter, RecruiterDocument } from "./schemas";
import { UpdateRecruiterDto } from "./dtos";
import { ResponseType } from "@common/dtos";

@Injectable()
export class RecruiterService {

  constructor(
    private readonly recruiterRepository: RecruiterRepository
  ) { }

  async updateRecruiter(request: { userId: string, data: UpdateRecruiterDto }): Promise<ResponseType> {
    const { userId, data } = request;
  
      try {  
        const updatedRecruiter = await this.recruiterRepository.findOneAndUpdate(
          { userId: userId },
          {
            $set: {
              position: data.position,
              companyName: data.companyName,
              companyWebsite: data.companyWebsite,
            }
          },
          { new: true, upsert: false }
        ) as RecruiterDocument;
  
        return {
          code: CodeResponseEnum.SUCCESS,
          data: updatedRecruiter
        };
      } catch (error) {
        throw new HttpException("createOrUpdateRecruiter error", HttpStatus.INTERNAL_SERVER_ERROR, {
          cause: error
        });
      }
    }
}
