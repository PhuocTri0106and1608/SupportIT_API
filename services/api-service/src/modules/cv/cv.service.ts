import { CodeResponseEnum, LoginRoleEnum } from "@common/enums";
import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ApplicationRepository, CVRepository, EvaluationRepository, JDRepository } from "./repositories";
import { CV, CVDocument, EvaluationDocument, JD, JDDocument } from "./schemas";
import { CVUploadDto, FilterApplicationsRequestDto, FilterCVsRequestDto, FilterEvaluationsRequestDto, FilterJDsRequestDto, CreateJdDto } from "./dtos";
import axios from "axios";
import { ResponseType } from "@common/dtos";
import { CandidateRepository } from "@modules/candidate/repositories";
import { Types } from "mongoose";
import { env } from "@environments";
import { RedisService } from "@modules/redis";
import { RecombeeService } from "@modules/recombee/recombee.service";
@Injectable()
export class CVService {

  constructor(
    private readonly CVRepository: CVRepository,
    private readonly jdRepository: JDRepository,
    private readonly evaluationRepository: EvaluationRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly candidateRepository: CandidateRepository,
    @Inject(forwardRef(() => RecombeeService))
    private readonly recombeeService: RecombeeService,
    private readonly redisService: RedisService,
  ) { }

  async uploadJD(request: { jd: CreateJdDto, userId: string, isRecruiter: boolean }): Promise<ResponseType> {
    const { jd, userId, isRecruiter } = request;

    try {
      const createdJD = await this.jdRepository.create({
        ...jd,
        creatorUserId: userId,
        verified: isRecruiter
      });

      await this.redisService.set(`jd:${createdJD._id}`, createdJD, { ttl: 3600 });
      if (isRecruiter && jd.visibility === "public") {
        await Promise.all([
          this.recombeeService.addJD(createdJD as JDDocument),
          this.recombeeService.createJobIdealCandidate(createdJD._id.toString())
        ]);
      }

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
        candidateId: userId,
        position: cv.position,
        fileUrl: cv.fileUrl,
        fileName: cv.fileName,
        information: extractCVResponse,
      });

      await Promise.all([
        this.candidateRepository.findOneAndUpdate(
          { userId: candidate.userId },
          {
            set: {
              position: cv.position,
              infomation: extractCVResponse
            }
          }),
        this.redisService.set(`cv:${createdCV._id}`, createdCV, { ttl: 3600 }),
        this.recombeeService.addCV(createdCV as CVDocument),
        this.recombeeService.addCandidate(candidate)
      ]);

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

  async applyCV(request: { userId: string, cvId: string, jdId: string }): Promise<ResponseType> {
    const { userId, cvId, jdId } = request;

    try {
      const candidate = await this.candidateRepository.findOne({ userId });
      if (!candidate) throw new HttpException("Candidate not found", HttpStatus.NOT_FOUND);

      // Try to get CV and JD from cache first
      let cv = await this.redisService.get<CV>(`cv:${cvId}`);
      let jd = await this.redisService.get<JD>(`jd:${jdId}`);

      // If not in cache, get from database
      if (!cv) {
        cv = await this.CVRepository.findById(cvId);
        if (cv) {
          await this.redisService.set(`cv:${cvId}`, cv, { ttl: 3600 });
        }
      }

      if (!jd) {
        jd = await this.jdRepository.findById(jdId);
        if (jd) {
          await this.redisService.set(`jd:${jdId}`, jd, { ttl: 3600 });
        }
      }

      if (!cv || !jd) {
        throw new HttpException("CV or JD not found", HttpStatus.NOT_FOUND);
      }

      // Call Flask API to evaluate CV against JD
      const response = await axios.post(`${env.flask.REVIEW_CV_URL}`, {
        cv: {
          position: cv.position,
          experience: cv.information.experience || [],
          skills: cv.information.skills || [],
          education: cv.information.education || [],
          projects: cv.information.projects || [],
          certifications: cv.information.certifications || [],
          languages: cv.information.languages || [],
        },
        jd: {
          title: jd.title,
          description: jd.description,
          position: jd.position,
          requirements: {
            experience: jd.requirements.experience || [],
            skills: jd.requirements.skills || [],
            education: jd.requirements.education || [],
            projects: jd.requirements.projects || [],
            summary: jd.requirements.summary || '',
            certifications: jd.requirements.certifications || [],
            languages: jd.requirements.languages || [],
          },
          benefits: jd.benefits || [],
          companyName: jd.companyName || '',
          location: jd.location || '',
        },
      });

      if (!response?.data) {
        throw new HttpException("Error in reviewing CV", HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const reviewCVResponse = response.data;

      // Create Evaluation
      const evaluation = await this.evaluationRepository.create({
        candidateId: userId,
        cvId,
        jdId,
        reviewCVResponse,
      });

      await this.recombeeService.addCandidate(candidate),
      await Promise.all([
        this.recombeeService.addEvaluation(evaluation as EvaluationDocument),
        this.applicationRepository.create({
          candidateId: userId,
          cvId,
          jdId,
          evaluationId: evaluation._id.toString(),
          status: "pending",
        }),
        this.recombeeService.addInteraction(
          userId,
          jd._id.toString(),
          "apply"
        )
      ]);

      return {
        code: CodeResponseEnum.SUCCESS,
        data: evaluation,
      };
    } catch (error) {
      throw new HttpException("reviewCV error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }
  async reviewCV(request: { userId: string, cvId: string, jdId: string }): Promise<ResponseType> {
    const { userId, cvId, jdId } = request;

    try {
      const candidate = await this.candidateRepository.findOne({ userId });
      if (!candidate) throw new HttpException("Candidate not found", HttpStatus.NOT_FOUND);

      // Try to get CV and JD from cache first
      let cv = await this.redisService.get<CV>(`cv:${cvId}`);
      let jd = await this.redisService.get<JD>(`jd:${jdId}`);

      // If not in cache, get from database
      if (!cv) {
        cv = await this.CVRepository.findById(cvId);
        if (cv) {
          await this.redisService.set(`cv:${cvId}`, cv, { ttl: 3600 });
        }
      }

      if (!jd) {
        jd = await this.jdRepository.findById(jdId);
        if (jd) {
          await this.redisService.set(`jd:${jdId}`, jd, { ttl: 3600 });
        }
      }

      if (!cv || !jd) {
        throw new HttpException("CV or JD not found", HttpStatus.NOT_FOUND);
      }

      // Call Flask API to evaluate CV against JD
      const response = await axios.post(`${env.flask.REVIEW_CV_URL}`, {
        cv: {
          position: cv.position,
          experience: cv.information.experience || [],
          skills: cv.information.skills || [],
          education: cv.information.education || [],
          projects: cv.information.projects || [],
          certifications: cv.information.certifications || [],
          languages: cv.information.languages || [],
        },
        jd: {
          title: jd.title,
          description: jd.description,
          position: jd.position,
          requirements: {
            experience: jd.requirements.experience || [],
            skills: jd.requirements.skills || [],
            education: jd.requirements.education || [],
            projects: jd.requirements.projects || [],
            summary: jd.requirements.summary || '',
            certifications: jd.requirements.certifications || [],
            languages: jd.requirements.languages || [],
          },
          benefits: jd.benefits || [],
          companyName: jd.companyName || '',
          location: jd.location || '',
        },
      });

      if (!response?.data) {
        throw new HttpException("Error in reviewing CV", HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const reviewCVResponse = response.data;

      // Create Evaluation
      const evaluation = await this.evaluationRepository.create({
        candidateId: userId,
        cvId,
        jdId,
        reviewCVResponse,
      });

      await Promise.all([
        this.recombeeService.addEvaluation(evaluation as EvaluationDocument),
        this.recombeeService.addCandidate(candidate)
      ]);
      // this.recombeeService.addInteraction(
      //   userId,
      //   jd._id.toString(),
      //   "apply"
      // );
      return {
        code: CodeResponseEnum.SUCCESS,
        data: evaluation,
      };
    } catch (error) {
      console.error("Error in reviewCV:", error.message);
      throw new HttpException("reviewCV error", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }

  async getListApplications(query: FilterApplicationsRequestDto): Promise<ResponseType> {
    const { page = 1, limit = 10, candidateId, cvId, jdId, evaluationId, status } = query;
    const skip = (page - 1) * limit;

    try {
      const filter: any = { deletedAt: null };
      if (candidateId) filter.candidateId = candidateId;
      if (cvId) filter.cvId = cvId;
      if (jdId) filter.jdId = jdId;
      if (evaluationId) filter.evaluationId = evaluationId;
      if (status) filter.status = status;

      const cacheKey = `applications:list:page=${page}:limit=${limit}:${JSON.stringify(query)}`;

      const cached = await this.redisService.get<any>(cacheKey);
      if (cached) {
        return { code: CodeResponseEnum.SUCCESS, data: cached };
      }

      const [applications, total] = await Promise.all([
        this.applicationRepository.findWithPagination(filter, skip, limit),
        this.applicationRepository.countDocuments(filter),
      ]);

      const resultData = {
        items: applications,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };

      await this.redisService.set(cacheKey, resultData, { ttl: 60 });

      return { code: CodeResponseEnum.SUCCESS, data: resultData };
    } catch (error) {
      throw new HttpException("getListApplications error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }

  async getListCVs(query: FilterCVsRequestDto): Promise<ResponseType> {
    const { page = 1, limit = 10, candidateId } = query;
    const skip = (page - 1) * limit;

    try {
      const filter: any = { deletedAt: null };
      if (candidateId) filter.candidateId = candidateId;

      const cacheKey = `cvs:list:page=${page}:limit=${limit}:${JSON.stringify(query)}`;

      const cached = await this.redisService.get<any>(cacheKey);
      if (cached) {
        return { code: CodeResponseEnum.SUCCESS, data: cached };
      }

      const [cvs, total] = await Promise.all([
        this.CVRepository.findWithPagination(filter, skip, limit, true, '-information'),
        this.CVRepository.countDocuments(filter),
      ]);

      const resultData = {
        items: cvs,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };

      await this.redisService.set(cacheKey, resultData, { ttl: 60 });

      return { code: CodeResponseEnum.SUCCESS, data: resultData };
    } catch (error) {
      throw new HttpException("getListCVs error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }
  async getListEvaluations(query: FilterEvaluationsRequestDto): Promise<ResponseType> {
    const { page = 1, limit = 10, candidateId, cvId, jdId } = query;
    const skip = (page - 1) * limit;

    try {
      const filter: any = { deletedAt: null };
      if (candidateId) filter.candidateId = candidateId;
      if (cvId) filter.cvId = cvId;
      if (jdId) filter.jdId = jdId;

      const cacheKey = `evaluations:list:page=${page}:limit=${limit}:${JSON.stringify(query)}`;

      const cached = await this.redisService.get<any>(cacheKey);
      if (cached) {
        return { code: CodeResponseEnum.SUCCESS, data: cached };
      }

      const [evaluations, total] = await Promise.all([
        this.evaluationRepository.findWithPagination(filter, skip, limit, true, '-reviewCVResponse'),
        this.evaluationRepository.countDocuments(filter),
      ]);

      const resultData = {
        items: evaluations,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };

      await this.redisService.set(cacheKey, resultData, { ttl: 60 });

      return { code: CodeResponseEnum.SUCCESS, data: resultData };
    } catch (error) {
      throw new HttpException("getListEvaluations error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }
  async getListJDs(query: FilterJDsRequestDto): Promise<ResponseType> {
    const { page = 1, limit = 10, creatorUserId, title, companyName, location, visibility, skill, verified } = query;
    const skip = (page - 1) * limit;

    try {
      const filter: any = { deletedAt: null };
      if (creatorUserId) filter.creatorUserId = creatorUserId;
      if (title) filter.title = { $regex: title, $options: "i" };
      if (companyName) filter.companyName = { $regex: companyName, $options: "i" };
      if (location) filter.location = { $regex: location, $options: "i" };
      if (visibility) filter.visibility = visibility;
      if (verified) filter.verified = verified;
      if (skill) filter['requirements.skills'] = { $in: [skill] };

      const cacheKey = `jds:list:page=${page}:limit=${limit}:${JSON.stringify(query)}`;

      const cached = await this.redisService.get<any>(cacheKey);
      if (cached) {
        return { code: CodeResponseEnum.SUCCESS, data: cached };
      }

      const [jds, total] = await Promise.all([
        this.jdRepository.findWithPagination(filter, skip, limit, true, '-requirements'),
        this.jdRepository.countDocuments(filter),
      ]);

      const resultData = {
        items: jds,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };

      await this.redisService.set(cacheKey, resultData, { ttl: 60 });

      return { code: CodeResponseEnum.SUCCESS, data: resultData };
    } catch (error) {
      throw new HttpException("getListJDs error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }
  async getApplicationById(id: string): Promise<ResponseType> {
    try {
      const application = await this.applicationRepository.findById(id);

      if (!application) {
        return {
          code: CodeResponseEnum.ERROR,
          message: `Application with id ${id} not found`,
        }
      }

      return {
        code: CodeResponseEnum.SUCCESS,
        data: application,
      };
    } catch (error) {
      throw new HttpException("getApplicationById error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }
  async getCVById(id: string): Promise<ResponseType> {
    try {
      const cv = await this.CVRepository.findById(id);

      if (!cv) {
        return {
          code: CodeResponseEnum.ERROR,
          message: `CV with id ${id} not found`,
        }
      }

      return {
        code: CodeResponseEnum.SUCCESS,
        data: cv,
      };
    } catch (error) {
      throw new HttpException("getCVById error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }
  async getEvaluationById(id: string): Promise<ResponseType> {
    try {
      const evaluation = await this.evaluationRepository.findById(id);

      if (!evaluation) {
        return {
          code: CodeResponseEnum.ERROR,
          message: `Evaluation with id ${id} not found`,
        }
      }

      return {
        code: CodeResponseEnum.SUCCESS,
        data: evaluation,
      };
    } catch (error) {
      throw new HttpException("getEvaluationById error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }
  async getJDById(id: string): Promise<ResponseType> {
    try {
      const jd = await this.jdRepository.findById(id);

      if (!jd) {
        return {
          code: CodeResponseEnum.ERROR,
          message: `JD with id ${id} not found`
        }
      }

      return {
        code: CodeResponseEnum.SUCCESS,
        data: jd,
      };
    } catch (error) {
      throw new HttpException("getJDById error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }
  async deleteJD(id: string): Promise<ResponseType> {
    try {
      const jd = await this.jdRepository.findOneAndUpdate({ _id: new Types.ObjectId(id) }, { deletedAt: new Date() });

      if (!jd) {
        return {
          code: CodeResponseEnum.ERROR,
          message: `JD with id ${id} not found`,
        }
      }

      return {
        code: CodeResponseEnum.SUCCESS,
        data: jd,
      };
    } catch (error) {
      throw new HttpException("deleteJD error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }

  async deleteCV(id: string): Promise<ResponseType> {
    try {
      const cv = await this.CVRepository.findOneAndUpdate({ _id: new Types.ObjectId(id) }, { deletedAt: new Date() });

      if (!cv) {
        return {
          code: CodeResponseEnum.ERROR,
          message: `CV with id ${id} not found`,
        }
      }

      return {
        code: CodeResponseEnum.SUCCESS,
        data: cv,
      };
    } catch (error) {
      throw new HttpException("deleteCV error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
    }
  }

  async updateApplicationStatus(
    applicationId: string,
    status: "pending" | "shortlisted" | "rejected" | "accepted",
    recruiterId: string
  ): Promise<ResponseType> {
    try {
      const application = await this.applicationRepository.findById(applicationId);

      if (!application) {
        return {
          code: CodeResponseEnum.ERROR,
          message: `Application with id ${applicationId} not found`,
        };
      }

      // Kiểm tra xem JD có thuộc về recruiter này không
      const jd = await this.jdRepository.findById(application.jdId);
      if (!jd || jd.creatorUserId !== recruiterId) {
        return {
          code: CodeResponseEnum.ERROR,
          message: "You don't have permission to update this application",
        };
      }

      const updatedApplication = await this.applicationRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(applicationId) },
        { status }
      );

      // Xóa cache liên quan
      const cachePattern = 'applications:list:*';
      await Promise.all([
        this.redisService.deleteByPattern(cachePattern),
        this.recombeeService.addInteraction(
          application.candidateId,
          jd._id.toString(),
          status
        )
      ]);

      return {
        code: CodeResponseEnum.SUCCESS,
        data: updatedApplication,
      };
    } catch (error) {
      throw new HttpException(
        "updateApplicationStatus error",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error }
      );
    }
  }
}