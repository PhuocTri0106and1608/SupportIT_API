import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { CandidateAnswerDto, CreateInterviewQuestionDto, FilterInterviewAnswerRequestDto, FilterInterviewQuestionRequestDto, FilterInterviewResultRequestDto, InterviewMarkDto } from "./dtos";
import { InterviewQuestionRepository, InterviewResultRepository } from "./repositories";
import { InterviewAnswerRepository } from "./repositories/interview-answer.repository";
import { InterviewAnswerDocument, InterviewQuestionDocument } from "./schemas";

@Injectable()
export class InterviewService {
    constructor(
        private readonly interviewQuestionRepository: InterviewQuestionRepository,
        private readonly interviewAnswerRepository: InterviewAnswerRepository,
        private readonly interviewResultRepository: InterviewResultRepository
    ) {}

    async createInterviewQuestion(creatorUserId: string, request: CreateInterviewQuestionDto): Promise<ResponseType<InterviewQuestionDocument>> {
        try {
            const question = (await this.interviewQuestionRepository.create({ ...request, creatorUserId: creatorUserId })) as InterviewQuestionDocument;

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

    async submitCandidateAnswer(candidateId: string, request: CandidateAnswerDto): Promise<ResponseType<InterviewAnswerDocument>> {
        try {
            const submittedAt = new Date();

            const answer = (await this.interviewAnswerRepository.findOneAndUpdate(
                {
                    questionId: request.questionId,
                    candidateId
                },
                {
                    ...request,
                    candidateId,
                    submittedAt
                }
            )) as InterviewAnswerDocument;

            const [interviewResult, listQuestion] = await Promise.all([
                this.interviewResultRepository.findOne({
                    jdId: request.jdId,
                    candidateId
                }),
                this.interviewQuestionRepository.find({
                    jdId: request.jdId
                })
            ]);

            let updateFields: any = {
                $addToSet: {
                    answerIds: answer._id.toString(),
                    completedQuestionIds: answer.questionId
                }
            };

            if (!interviewResult || !interviewResult.startedAt || submittedAt > interviewResult.startedAt) {
                updateFields.$set = {
                    startedAt: submittedAt
                };
            }
            if (listQuestion.length === interviewResult.completedQuestionIds.length) {
                updateFields.$set = {
                    submitted: true,
                    endAt: new Date(),
                    actualDuration: Math.floor((new Date().getTime() - interviewResult.startedAt.getTime()) / 1000)
                };
            }

            this.interviewResultRepository.findOneAndUpdate(
                {
                    jdId: request.jdId,
                    candidateId
                },
                updateFields
            );

            return {
                code: CodeResponseEnum.SUCCESS,
                data: answer
            };
        } catch (error) {
            throw new HttpException(`submitCandidateAnswer error: ${error?.message}`, HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: error
            });
        }
    }

    async markCandidateAnswer(evaluatorUserId: string, request: InterviewMarkDto): Promise<ResponseType<InterviewAnswerDocument>> {
        const { answerId, evaluatedScoreDetails, overallQuestionScore } = request;
        try {
            const evaluatedAt = new Date();
            const score = (await this.interviewAnswerRepository.findOneAndUpdate(
                { _id: new Types.ObjectId(answerId), evaluatorUserId: null },
                { evaluatorUserId, evaluatedAt, evaluatedScoreDetails, overallQuestionScore }
            )) as InterviewAnswerDocument;

            let updateFields: any = {
                $inc: {
                    totalScore: overallQuestionScore
                }
            };
            this.interviewResultRepository.findOneAndUpdate(
                {
                    jdId: score.jdId,
                    candidateId: score.candidateId
                },
                updateFields
            );
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

    async getListInterviewAnswers(query: FilterInterviewAnswerRequestDto): Promise<ResponseType> {
        const { page = 1, limit = 10, jdId, questionId, evaluatorUserId, submittedAfter, submittedBefore, minOverallQuestionScore } = query;
        const skip = (page - 1) * limit;

        try {
            const filter: any = { deletedAt: null };
            if (jdId) {
                filter["jdId"] = jdId;
            }

            if (questionId) {
                filter["questionId"] = questionId;
            }

            if (evaluatorUserId) {
                filter["evaluatorUserId"] = evaluatorUserId;
            }

            if (submittedAfter) {
                filter["submittedAt"] = { $gte: submittedAfter };
            }

            if (submittedBefore) {
                filter["submittedAt"] = { $lte: submittedBefore };
            }

            if (minOverallQuestionScore) {
                filter["overallQuestionScore"] = { $gte: minOverallQuestionScore };
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
            throw new HttpException("getListInterviewResults error", HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: error
            });
        }
    }

    async getListInterviewResults(query: FilterInterviewResultRequestDto): Promise<ResponseType> {
        const { page = 1, limit = 10, jdId, candidateId, minTotalScore, submitted, startedAfter, startedBefore } = query;
        const skip = (page - 1) * limit;

        try {
            const filter: any = { deletedAt: null };
            if (jdId) {
                filter["jdId"] = jdId;
            }

            if (candidateId) {
                filter["candidateId"] = candidateId;
            }

            if (submitted) {
                filter["submitted"] = submitted;
            }

            if (minTotalScore) {
                filter["totalScore"] = { $gte: minTotalScore };
            }

            if (startedAfter) {
                filter["startedAt"] = { $gte: startedAfter };
            }

            if (startedBefore) {
                filter["startedAt"] = { $lte: startedBefore };
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
            throw new HttpException("getListInterviewResults error", HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: error
            });
        }
    }
}
