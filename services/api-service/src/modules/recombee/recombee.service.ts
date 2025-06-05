import { env } from '@environments';
import { CandidateRepository } from '@modules/candidate/repositories';
import { JDRepository } from '@modules/cv/repositories';
import { CVDocument, EvaluationDocument, JDDocument } from '@modules/cv/schemas';
import { Injectable } from '@nestjs/common';
import { AddItem, SetItemValues, AddDetailView, AddPurchase, AddRating, RecommendItemsToItem, RecommendItemsToUser, ListItems, SetUserValues, ListUsers, RecommendUsersToUser, AddUserProperty, AddItemProperty, AddBookmark, DeleteUser } from 'recombee-api-client/lib/requests';
import { ApiClient } from 'recombee-api-client';
import { CandidateDocument } from '@modules/candidate/schemas';
import { RedisService } from '@modules/redis';


@Injectable()
export class RecombeeService {
  private client: ApiClient;

  constructor(
    private readonly jdRepository: JDRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly redisService: RedisService,
  ) {
    this.client = new ApiClient(env.recombee.DB_DEV, env.recombee.DEV_PRIVATE_TOKEN, { region: 'ap-se' });
    // this.initializeProperties();
  }
  async initializeProperties() {
    await this.addItemProperties();
    await this.addUserProperties();
  }
  // Định nghĩa thuộc tính cho item (CV, JD)
  async addItemProperties() {
    try {
      await this.client.send(new AddItemProperty('candidateId', 'string'));
      await this.client.send(new AddItemProperty('position', 'string'));
      await this.client.send(new AddItemProperty('skills', 'set'));
      await this.client.send(new AddItemProperty('experience', 'set'));
      await this.client.send(new AddItemProperty('education', 'set'));
      await this.client.send(new AddItemProperty('projects', 'set'));
      await this.client.send(new AddItemProperty('summary', 'string'));
      await this.client.send(new AddItemProperty('certifications', 'set'));
      await this.client.send(new AddItemProperty('languages', 'set'));
      await this.client.send(new AddItemProperty('creatorUserId', 'string'));
      await this.client.send(new AddItemProperty('title', 'string'));
      await this.client.send(new AddItemProperty('description', 'string'));
      await this.client.send(new AddItemProperty('companyName', 'string'));
      await this.client.send(new AddItemProperty('location', 'string'));
      await this.client.send(new AddItemProperty('benefits', 'set'));
      await this.client.send(new AddItemProperty('type', 'string')); // Phân biệt CV/JD
      await this.client.send(new AddItemProperty('visibility', 'string')); // public/private
      await this.client.send(new AddItemProperty('verified', 'boolean')); // verified
      console.log('Successfully added item properties to Recombee');
    } catch (error) {
      console.error('Error adding item properties to Recombee:', error);
    }
  }

  // Định nghĩa thuộc tính cho user (ứng viên, nhà tuyển dụng)
  async addUserProperties() {
    try {
      await this.client.send(new AddUserProperty('position', 'string'));
      await this.client.send(new AddUserProperty('skills', 'set'));
      await this.client.send(new AddUserProperty('experience', 'set'));
      await this.client.send(new AddUserProperty('location', 'string'));
      await this.client.send(new AddUserProperty('education', 'set'));
      await this.client.send(new AddUserProperty('projects', 'set'));
      await this.client.send(new AddUserProperty('summary', 'string'));
      await this.client.send(new AddUserProperty('certifications', 'set'));
      await this.client.send(new AddUserProperty('languages', 'set'));
      await this.client.send(new AddUserProperty('isJobIdeal', 'boolean')); // Dùng cho ứng viên lý tưởng
      console.log('Successfully added user properties to Recombee');
    } catch (error) {
      console.error('Error adding user properties to Recombee:', error);
    }
  }
  // Thêm CV vào Recombee
  async addCV(cv: CVDocument) {
    const request = new AddItem(cv._id.toString());
    await this.client.send(request);
    await this.client.send(
      new SetItemValues(cv._id.toString(), {
        candidateId: cv.candidateId,
        position: cv.position,
        skills: (cv.information?.skills || []).map(skill => skill.toLowerCase()) || [],
        experience: cv.information?.experience || [],
        education: cv.information?.education || [],
        projects: cv.information?.projects || [],
        summary: cv.information?.summary || '',
        certifications: cv.information?.certifications || [],
        languages: cv.information?.languages || [],
        type: 'cv',
      }, { cascadeCreate: true }),
    );
  }

  // Thêm JD vào Recombee
  async addJD(jd: JDDocument) {
    const request = new AddItem(jd._id.toString());
    await this.client.send(request);
    await this.client.send(
      new SetItemValues(jd._id.toString(), {
        creatorUserId: jd.creatorUserId,
        title: jd.title,
        description: jd.description,
        position: jd.position,
        companyName: jd.companyName || '',
        location: jd.location || '',
        skills: (jd.requirements.skills || []).map(skill => skill.toLowerCase()) || [],
        experience: jd.requirements.experience || [],
        education: jd.requirements.education || [],
        benefits: jd.benefits || [],
        type: 'jd',
        visibility: jd.visibility || 'private',
        verified: jd.verified
      }, { cascadeCreate: true }),
    );
  }

  // Thêm tương tác (interaction)
  async addInteraction(userId: string, itemId: string, interactionType: string) {
    const timestamp = new Date().toISOString();

    switch (interactionType) {
      case 'apply':
        await this.client.send(new AddPurchase(userId, itemId, { timestamp }));
        break;
      case 'shortlisted':
        await this.client.send(new AddBookmark(userId, itemId, { timestamp }));
        break;
      case 'accepted':
        await this.client.send(new AddPurchase(userId, itemId, {
          timestamp,
          rating: 1 // Positive interaction
        }));
        break;
      case 'rejected':
        await this.client.send(new AddPurchase(userId, itemId, {
          timestamp,
          rating: -1 // Negative interaction
        }));
        break;
      default:
        await this.client.send(new AddDetailView(userId, itemId, { timestamp }));
    }
  }

  // Thêm đánh giá từ Evaluation
  async addEvaluation(evaluation: EvaluationDocument) {
    const rating = (evaluation.reviewCVResponse.summary.overall_score / 50) - 1; // Chuyển đổi overall_score (0-100) thành rating (-1 đến 1)
    const request = new AddRating(
      evaluation.candidateId,
      evaluation.jdId,
      rating,
      { timestamp: evaluation.createdAt.toISOString() },
    );
    await this.client.send(request);
  }

  async addCandidate(candidate: CandidateDocument) {
    try {
      const userValues = {
        position: candidate.position || '',
        certifications: candidate.information?.certifications || [],
        education: candidate.information?.education || [],
        languages: candidate.information?.languages || [],
        projects: candidate.information?.projects || [],
        summary: candidate.information?.summary || '',
        skills: (candidate.information?.skills || []).map(skill => skill.toLowerCase()) || [],
        experience: candidate.information?.experience || [],
        isJobIdeal: false,
      };
      console.log(userValues);

      await this.client.send(
        new SetUserValues(candidate.userId, userValues, { cascadeCreate: true }),
      );
      console.log(`User ${candidate.userId} added/updated in Recombee`);
    } catch (error) {
      console.error(`Error adding/updating user ${candidate._id.toString()} in Recombee:`, error);
      throw error;
    }
  }

  async createJobIdealCandidate(jdId: string) {
    try {
      const jd = await this.jdRepository.findById(jdId);
      const userValues = {
        skills: (jd.requirements.skills || []).map(skill => skill.toLowerCase()) || [],
        certifications: jd.requirements.certifications || [],
        education: jd.requirements.education || [],
        languages: jd.requirements.languages || [],
        projects: jd.requirements.projects || [],
        summary: jd.requirements.summary || '',
        experience: jd.requirements.experience || [],
        position: jd.position || '',
        location: jd.location || '',
        isJobIdeal: true,
      };
      await this.client.send(new SetUserValues(jdId, userValues, { cascadeCreate: true }));
    } catch (error) {
      console.error('Error creating ideal candidate for JD:', error);
      throw error;
    }
  }

  async recommendCandidatesForJD(jdId: string, limit: number = 10, page: number = 1) {
    const cacheKey = `recommendations:jd:${jdId}:limit:${limit}:page:${page}`;
    const CACHE_EXPIRATION_SECONDS = 3600;
    try {
      const cachedCandidates = await this.redisService.get(cacheKey);
      if (cachedCandidates) {
        return JSON.parse(cachedCandidates);
      }
      await this.createJobIdealCandidate(jdId);
      const request = new RecommendUsersToUser(jdId, limit, {
        scenario: 'jd-to-candidate',
        filter: "'isJobIdeal' == false or 'isJobIdeal' == null",
        returnProperties: true,
        diversity: 0.5,
        rotationTime: 0.0,
        rotationRate: 0.0,
        offset: (page - 1) * limit
      });
      const response = await this.client.send(request);
      let users = response.recomms;

      // Fallback nếu không có gợi ý
      if (users.length === 0) {
        const fallbackRequest = new ListUsers({
          returnProperties: true,
          offset: (page - 1) * limit,
        });
        const fallbackResponse = await this.client.send(fallbackRequest);
        users = fallbackResponse.items;
      }
      await this.redisService.set(cacheKey, JSON.stringify(users), { ttl: CACHE_EXPIRATION_SECONDS });
      return users;
    } catch (error) {
      console.error('Error recommending candidates for JD:', error);
      throw error;
    }
  }

  // Gợi ý CV cho JD
  async recommendCVsForJD(jdId: string, limit: number = 10, page: number = 1) {
    try {
      const jd = await this.jdRepository.findById(jdId);
      if (!jd) {
        throw new Error('JD not found for recommendation');
      }

      const jdSkills = (jd.requirements.skills || []).map(s => s.toLowerCase());
      const jdPosition = jd.position?.toLowerCase();

      let boosterParts: string[] = [];
      if (jdSkills.length > 0) {
        boosterParts.push(`sum(map(${JSON.stringify(jdSkills)}, jd_skill -> if (item['skills'] != null and contains(item['skills'], jd_skill)) then 1.0 else 0.0)) * 0.7`);
      }

      if (jdPosition) {
        boosterParts.push(`(if item['position'] != null and item['position'] == "${jdPosition}" then 1.5 else 1.0)`);
      }

      const request = new RecommendItemsToItem(
        jdId, // Item (JD) mà chúng ta đang tìm gợi ý CV cho nó
        jdId, // Ngữ cảnh người dùng (sử dụng chính JD làm ngữ cảnh)
        limit,
        {
          scenario: 'jd-to-cv-similarity',
          filter: "'type' == \"cv\"", // Chỉ lấy các item là CV
          returnProperties: true,
          booster: boosterParts.length > 0 ? boosterParts.join(' * ') : undefined, // Quan trọng
          offset: (page - 1) * limit,
        }
      );
      const response = await this.client.send(request);
      let cvIds = response.recomms.map((r: any) => r.id);

      // Fallback nếu không có gợi ý
      if (cvIds.length === 0) {
        const fallbackRequest = new ListItems({
          returnProperties: true,
          filter: "'type' == \"cv\"",
          offset: (page - 1) * limit
        });
        const fallbackResponse = await this.client.send(fallbackRequest);
        cvIds = fallbackResponse.items.map((item) => item.itemId);
      }

      return cvIds;
    } catch (error) {
      console.error('Error recommending CVs for JD:', error);
      throw error;
    }
  }

  // Gợi ý JD cho ứng viên
  async recommendJDsForCandidate(candidateId: string, limit: number = 10, page: number = 1) {
    const cacheKey = `recommendations:candidate:${candidateId}:limit:${limit}:page:${page}`;
    const candidateSkillsCacheKey = `candidate_skills:${candidateId}`;
    const CACHE_EXPIRATION_SECONDS = 3600;

    try {
      const cachedJDs = await this.redisService.get(cacheKey);
      if (cachedJDs) {
        console.log('Serving JDs from Redis cache');
        return JSON.parse(cachedJDs);
      }
      let candidateSkills: string[] = [];
      const cachedCandidateSkills = await this.redisService.get(candidateSkillsCacheKey);

      if (cachedCandidateSkills) {
        candidateSkills = JSON.parse(cachedCandidateSkills);
        console.log('Serving candidate skills from Redis cache');
      } else {
        const candidate = await this.candidateRepository.findById(candidateId);
        candidateSkills = (candidate?.information?.skills || []).map(skill => skill.toLowerCase());

        await this.redisService.set(candidateSkillsCacheKey, JSON.stringify(candidateSkills), { ttl: CACHE_EXPIRATION_SECONDS });
        console.log('Candidate skills fetched from DB and cached');
      }

      let boosterString: string | undefined;
      if (candidateSkills.length > 0) {
        boosterString = `sum(map(item['skills'], jd_skill -> if (${JSON.stringify(candidateSkills)}.indexOf(jd_skill) > -1) then 1.0 else 0.0)) * 0.6`;
      }

      const request = new RecommendItemsToUser(candidateId, limit, {
        scenario: 'candidate-to-jd',
        booster: boosterString,
        filter: "'type' == \"jd\" and 'visibility' == \"public\" and 'verified' == true",
        returnProperties: true,
        offset: (page - 1) * limit
      });

      let jds = (await this.client.send(request)).recomms;

      // Fallback nếu không có gợi ý
      if (jds.length === 0) {
        console.log('No recommendations, performing fallback');
        const fallbackRequest = new ListItems({
          returnProperties: true,
          filter: "'type' == \"jd\" and 'visibility' == \"public\" and 'verified' == true",
          offset: (page - 1) * limit
        });
        jds = (await this.client.send(fallbackRequest)).items;
      }

      await this.redisService.set(cacheKey, JSON.stringify(jds), { ttl: CACHE_EXPIRATION_SECONDS });

      return jds;
    } catch (error) {
      console.error('Error recommending JDs for candidate:', error);
      // Đảm bảo đóng kết nối Redis nếu có lỗi nghiêm trọng hoặc xử lý lại lỗi
      throw error;
    }
  }
}