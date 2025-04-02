import { env } from "@environments";
import { Injectable } from "@nestjs/common";
import { MongooseModuleOptions, MongooseOptionsFactory } from "@nestjs/mongoose";

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
    createMongooseOptions(): MongooseModuleOptions {
        return {
            uri: env.db.MONGODB_URI,
            dbName: env.db.MONGO_DB_NAME,
            maxConnecting: 10,
            maxPoolSize: 10,
            connectTimeoutMS: 5000
        };
    }
}
