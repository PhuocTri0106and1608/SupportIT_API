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
  findWithPaginationAndSort(
    filter: FilterQuery<Application> = {},
    skip: number = 0,
    limit: number = 10,
  ): Promise<any> {
    return this._model.find(filter).sort({ overallScore: -1 }).skip(skip).limit(limit).lean().exec();
  }
}
