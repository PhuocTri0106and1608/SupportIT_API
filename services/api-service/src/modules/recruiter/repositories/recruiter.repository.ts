import { BaseMongoRepository } from "@common/repositories";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Recruiter } from "../schemas/recruiter.schema";

@Injectable()
export class RecruiterRepository extends BaseMongoRepository<Recruiter> {
  constructor(@InjectModel(Recruiter.name) private readonly recruiterModel: Model<Recruiter>) {
    super(recruiterModel);
  }
}
