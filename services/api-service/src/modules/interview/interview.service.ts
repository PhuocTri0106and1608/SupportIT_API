import { InterviewAnswerRepository } from './repositories/interview-answer.repository';
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";
import { InterviewQuestionRepository } from "./repositories";
import { InterviewAnswerDocument, InterviewQuestionDocument } from "./schemas";
import { CandidateAnswerDto, CreateInterviewQuestionDto, FilterInterviewQuestionRequestDto, InterviewMarkDto } from "./dtos";
import { Types } from 'mongoose';

@Injectable()
export class InterviewService {

  constructor(
    private readonly interviewQuestionRepository: InterviewQuestionRepository,
    private readonly interviewAnswerRepository: InterviewAnswerRepository
  ) { }

  async createInterviewQuestion(creatorUserId: string, request: CreateInterviewQuestionDto): Promise<ResponseType<InterviewQuestionDocument>> {

    try {
      const question = await this.interviewQuestionRepository.create({...request, creatorUserId: creatorUserId}) as InterviewQuestionDocument;

        return {
          code: CodeResponseEnum.SUCCESS,
          data: question
        };
    } catch (error) {
      throw new HttpException(`createInterviewQuestion error: ${error?.message}`, HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }

  async createCandidateAnswer(candidateId: string, request: CandidateAnswerDto): Promise<ResponseType<InterviewAnswerDocument>> {

    try {
      const submittedAt = new Date();
      const answer = await this.interviewAnswerRepository.create({...request, candidateId, submittedAt}) as InterviewAnswerDocument;

        return {
          code: CodeResponseEnum.SUCCESS,
          data: answer
        };
    } catch (error) {
      throw new HttpException(`createCandidateAnswer error: ${error?.message}`, HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }

  async markCandidateAnswer(evaluatorUserId: string, request: InterviewMarkDto): Promise<ResponseType<InterviewAnswerDocument>> {
    const { answerId, evaluatedScoreDetails, overallQuestionScore } = request;
    try {
      const evaluatedAt  = new Date();
      const score = await this.interviewAnswerRepository.findOneAndUpdate({ _id: new Types.ObjectId(answerId), evaluatorUserId: null }, { evaluatorUserId, evaluatedAt, evaluatedScoreDetails, overallQuestionScore }) as InterviewAnswerDocument;

        return {
          code: CodeResponseEnum.SUCCESS,
          data: score
        };
    } catch (error) {
      throw new HttpException(`markCandidateAnswer error: ${error?.message}`, HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }

  async getListInterviewQuestions(query: FilterInterviewQuestionRequestDto): Promise<ResponseType> {
    const { page = 1, limit = 10, name, creatorUserId, type, expectedKeyword } = query;
    const skip = (page - 1) * limit;

    try {
      const filter: any = { deletedAt: null };
      if (name) {
        filter["name"] = name;
      }

      if (creatorUserId) {
        filter["creatorUserId"] = creatorUserId;
      }

      if (type) {
        filter["type"] = type;
      }

      if (expectedKeyword) {
        filter["expectedKeyword"] = expectedKeyword;
      }

      const [interviews, total] = await Promise.all([
        this.interviewQuestionRepository.findWithPagination(filter, skip, limit),
        this.interviewQuestionRepository.countDocuments(filter)
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
      throw new HttpException("getListInterviewQuestions error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error
      });
    }
  }

}
