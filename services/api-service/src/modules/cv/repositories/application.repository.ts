import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Application } from "../schemas";

@Injectable()
export class ApplicationRepository extends BaseMongoRepository<Application> {
  constructor(@InjectModel(Application.name) private readonly _model: Model<Application>) {
    super(_model);
  }
}
