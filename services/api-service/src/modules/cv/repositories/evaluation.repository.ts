import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Evaluation } from "../schemas";

@Injectable()
export class EvaluationRepository extends BaseMongoRepository<Evaluation> {
  constructor(@InjectModel(Evaluation.name) private readonly _model: Model<Evaluation>) {
    super(_model);
  }
}
