import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CV } from "../schemas/cv.schema";

@Injectable()
export class CVRepository extends BaseMongoRepository<CV> {
  constructor(@InjectModel(CV.name) private readonly cvModel: Model<CV>) {
    super(cvModel);
  }
}
