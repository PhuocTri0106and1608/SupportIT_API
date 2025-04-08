import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Candidate } from "../schemas/candidate.schema";

@Injectable()
export class CandidateRepository extends BaseMongoRepository<Candidate> {
  constructor(@InjectModel(Candidate.name) private readonly candidateModel: Model<Candidate>) {
    super(candidateModel);
  }
}
