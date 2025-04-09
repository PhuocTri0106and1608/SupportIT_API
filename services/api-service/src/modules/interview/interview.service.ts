import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InterviewRepository } from "./repositories";
import { InterviewDto } from "./dtos";
import { InterviewDocument } from "./schemas/interview.schema";
import { FilterInterviewRequestDto } from "./dtos/filter-interview-request.dto";
import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";

@Injectable()
export class InterviewService {

  constructor(
    private readonly interviewRepository: InterviewRepository
  ) { }

  async createOrUpdateInterview(request: InterviewDto): Promise<ResponseType<InterviewDocument>> {
    const { questionSet, position, level, type, jobId } = request;

    try {
      const existingInterview = await this.interviewRepository.findOne({ position, level, type, jobId }, false);

      if (!existingInterview) {

        const interview = await this.interviewRepository.create(request) as InterviewDocument;

        return {
          code: CodeResponseEnum.SUCCESS,
          data: interview
        };
      }

      const updatedInterview = await this.interviewRepository.findOneAndUpdate(
        { position, level, type, jobId },
        {
          $set: {
            questionSet
          }
        },
        { new: true, upsert: false },
        false
      ) as InterviewDocument;

      return {
        code: CodeResponseEnum.SUCCESS,
        data: updatedInterview
      };
    } catch (error) {
      throw new HttpException("createOrUpdateInterview error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }

  async getListInterviews(query: FilterInterviewRequestDto): Promise<ResponseType> {
    const { page = 1, limit = 10, position, level, type, jobId } = query;
    const skip = (page - 1) * limit;

    try {
      const filter: any = { deletedAt: null };
      if (level) {
        filter["level"] = level;
      }

      if (position) {
        filter["position"] = position;
      }

      if (type) {
        filter["type"] = type;
      }

      if (jobId) {
        filter["jobId"] = jobId;
      }

      const [interviews, total] = await Promise.all([
        this.interviewRepository.findWithPagination(filter, skip, limit),
        this.interviewRepository.countDocuments(filter)
      ]);

      return {
        code: CodeResponseEnum.SUCCESS,
        data: {
          items: interviews,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      throw new HttpException("getListInterviews error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }

}
