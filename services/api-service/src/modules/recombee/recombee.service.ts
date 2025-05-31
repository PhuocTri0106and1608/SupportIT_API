import { env } from '@environments';
import { CandidateRepository } from '@modules/candidate/repositories';
import { JDRepository } from '@modules/cv/repositories';
import { CVDocument, EvaluationDocument, JDDocument } from '@modules/cv/schemas';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AddItem, SetItemValues, AddDetailView, AddPurchase, AddRating, RecommendItemsToItem, RecommendItemsToUser, ListItems, SetUserValues, ListUsers, RecommendUsersToUser, AddUserProperty, AddItemProperty } from 'recombee-api-client/lib/requests';
import { ApiClient } from 'recombee-api-client';


@Injectable()
export class RecombeeService {
  private client: ApiClient;

  constructor(
    @Inject(forwardRef(() => JDRepository))
    private readonly jdRepository: JDRepository,
    private readonly candidateRepository: CandidateRepository
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
        skills: cv.information?.skills || [],
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
        skills: jd.requirements.skills || [],
        experience: jd.requirements.experience || [],
        education: jd.requirements.education || [],
        benefits: jd.benefits || [],
        type: 'jd',
        visibility: jd.visibility || 'private',
        verified: true, // Giả sử JD đã được xác minh
      }, { cascadeCreate: true }),
    );
  }

  // Thêm tương tác (interaction)
  async addInteraction(userId: string, itemId: string, interactionType: string) {
    const request = new AddDetailView(userId, itemId, { timestamp: new Date().toISOString() });
    if (interactionType === 'apply') {
      const applyRequest = new AddPurchase(userId, itemId, { timestamp: new Date().toISOString() });
      await this.client.send(applyRequest);
    } else {
      await this.client.send(request);
    }
  }

  // Thêm đánh giá từ Evaluation
  async addEvaluation(evaluation: EvaluationDocument) {
    const rating = evaluation.reviewCVResponse.summary.similarity_score;
    const request = new AddRating(
      evaluation.candidateId,
      evaluation.jdId,
      rating,
      { timestamp: evaluation.createdAt.toISOString() },
    );
    await this.client.send(request);
  }

  async createJobIdealCandidate(jdId: string) {
    try {
      const jd = await this.jdRepository.findById(jdId);
      const userValues = {
        skills: jd.requirements.skills || [],
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
    try {
      await this.createJobIdealCandidate(jdId);
      const request = new RecommendUsersToUser(jdId, limit, {
        scenario: 'jd-to-candidate',
        filter: "'isJobIdeal' == false or 'isJobIdeal' == null",
        returnProperties: true,
        diversity: 0.5,
        rotationTime: 0.0,
        rotationRate: 0.0,
        page,
        booster: 'similarity_score * 0.4 + match_percent * 0.6',
      });
      const response = await this.client.send(request);
      let userIds = response.recomms.map((r) => r.id);

      // Fallback nếu không có gợi ý
      if (userIds.length === 0) {
        const fallbackRequest = new ListUsers({
          returnProperties: true,
          page,
          limit,
        });
        const fallbackResponse = await this.client.send(fallbackRequest);
        userIds = fallbackResponse.items.map((item) => item.userId);
      }

      return userIds;
    } catch (error) {
      console.error('Error recommending candidates for JD:', error);
      throw error;
    }
  }

  // Gợi ý CV cho JD
  async recommendCVsForJD(jdId: string, limit: number = 10, page: number = 1) {
    try {
      const request = new RecommendItemsToItem(jdId, 'cv', limit, {
        scenario: 'jd-to-cv',
        booster: 'similarity_score * 0.4 + match_percent * 0.6',
        returnProperties: true,
        filter: "'type' == \"cv\"",
        page,
      });
      const response = await this.client.send(request);
      let cvIds = response.recomms.map((r) => r.id);

      // Fallback nếu không có gợi ý
      if (cvIds.length === 0) {
        const fallbackRequest = new ListItems({
          returnProperties: true,
          filter: "'type' == \"cv\"",
          page,
          limit,
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
    try {
      const candidate = await this.candidateRepository.findById(candidateId);
      const boosters = [];
      if (candidate?.skills?.length) {
        boosters.push(`(if ('skills' in ${JSON.stringify(candidate.skills)}) then 1.5 else 1)`);
      }
      const booster = boosters.length > 0 ? boosters.join(' * ') : 'similarity_score * 0.4 + match_percent * 0.6';

      const request = new RecommendItemsToUser(candidateId, limit, {
        scenario: 'candidate-to-jd',
        booster,
        filter: "'type' == \"jd\" and 'visibility' == \"public\" and 'verified' == true",
        returnProperties: true,
        page,
      });
      const response = await this.client.send(request);
      let jdIds = response.recomms.map((r) => r.id);

      // Fallback nếu không có gợi ý
      if (jdIds.length === 0) {
        const fallbackRequest = new ListItems({
          returnProperties: true,
          filter: "'type' == \"jd\" and 'visibility' == \"public\" and 'verified' == true",
          page,
          limit,
        });
        const fallbackResponse = await this.client.send(fallbackRequest);
        jdIds = fallbackResponse.items.map((item) => item.itemId);
      }

      return jdIds;
    } catch (error) {
      console.error('Error recommending JDs for candidate:', error);
      throw error;
    }
  }
}