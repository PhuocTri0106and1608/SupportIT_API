import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { Application } from "../schemas";

@Injectable()
export class ApplicationRepository extends BaseMongoRepository<Application> {
  constructor(@InjectModel(Application.name) private readonly _model: Model<Application>) {
    super(_model);
  }
  async findWithDetailsAndPagination(
    filter: FilterQuery<Application> = {},
    skip: number = 0,
    limit: number = 10,
  ): Promise<any> {
    const pipeline: import("mongoose").PipelineStage[] = [
      { $match: filter },
      { $sort: { overallScore: -1 } },

      // Stage 3: Convert IDs correctly using $toObjectId
      {
        $addFields: {
          cvObjectId: { $toObjectId: "$cvId" },
          jdObjectId: { $toObjectId: "$jdId" }
        }
      },

      // Stage 4: Lookup CVs
      {
        $lookup: {
          from: 'cvs',
          localField: 'cvObjectId', // Use converted ObjectId
          foreignField: '_id',
          as: 'cvDetails',
        },
      },

      { $unwind: { path: '$cvDetails', preserveNullAndEmptyArrays: true } },

      // Stage 7: Lookup JDs - Fix the join field
      {
        $lookup: {
          from: 'jds', // Make sure this matches your JD collection name exactly
          localField: 'jdObjectId', // Use converted ObjectId
          foreignField: '_id',
          as: 'jdDetails',
        },
      },

      { $unwind: { path: '$jdDetails', preserveNullAndEmptyArrays: true } },

      // Final projection
      {
        $project: {
          _id: 1,
          candidateId: 1,
          cvId: 1,
          jdId: 1,
          evaluationId: 1,
          overallScore: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          cv: {
            _id: '$cvDetails._id',
            candidateId: '$cvDetails.candidateId',
            position: '$cvDetails.position',
            fileUrl: '$cvDetails.fileUrl',
            fileName: '$cvDetails.fileName',
          },
          jd: {
            _id: '$jdDetails._id',
            title: '$jdDetails.title',
            creatorUserId: '$jdDetails.creatorUserId',
            position: '$jdDetails.position',
            description: '$jdDetails.description',
            companyName: '$jdDetails.companyName',
            location: '$jdDetails.location',
            benefits: '$jdDetails.benefits',
            visibility: '$jdDetails.visibility',
          }
        }
      },

      { $skip: skip },
      { $limit: limit }
    ];

    return this._model.aggregate(pipeline).exec();
  }
}
