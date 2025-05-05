import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JD } from "../schemas";

@Injectable()
export class JDRepository extends BaseMongoRepository<JD> {
  constructor(@InjectModel(JD.name) private readonly _model: Model<JD>) {
    super(_model);
  }
}
