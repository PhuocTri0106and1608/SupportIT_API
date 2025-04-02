import { FilterQuery, Model, UpdateQuery } from "mongoose";

export class BaseMongoRepository<T> {
    constructor(private readonly model: Model<T>) {}

    find(filter: FilterQuery<T> = {}, isLean: boolean = true) {
        return isLean ? this.model.find(filter).lean().exec() : this.model.find(filter).exec();
    }

    findOne(filter: FilterQuery<T>, isLean: boolean = true, excludeFields?: string | string[]) {
        const query = this.model.findOne(filter);

        if (excludeFields) {
            query.select(Array.isArray(excludeFields) ? excludeFields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {}) : { [excludeFields]: 0 });
        }

        return isLean ? query.lean().exec() : query.exec();
    }

    findById(id: string, isLean: boolean = true) {
        return isLean ? this.model.findById(id).lean().exec() : this.model.findById(id).exec();
    }

    create(data) {
        const newDocument = new this.model(data);
        return newDocument.save();
    }

    findOneAndUpdate(filter: FilterQuery<T>, data: UpdateQuery<T>, option = { new: true, upsert: false }, isLean: boolean = true) {
        return isLean ? this.model.findOneAndUpdate(filter, data, option).lean().exec() : this.model.findOneAndUpdate(filter, data, option).exec();
    }

    updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>, option = { upsert: false }) {
        return this.model.updateOne(filter, data, option).exec();
    }

    deleteOne(filter: FilterQuery<T>) {
        return this.model.findOneAndDelete(filter).exec();
    }

    countDocuments(filter: FilterQuery<T>) {
        return this.model.countDocuments(filter).exec();
    }

    findWithPagination(filter: FilterQuery<T> = {}, skip: number = 0, limit: number = 10, isLean: boolean = true) {
        const query = this.model.find(filter).skip(skip).limit(limit);
        return isLean ? query.lean().exec() : query.exec();
    }
}
