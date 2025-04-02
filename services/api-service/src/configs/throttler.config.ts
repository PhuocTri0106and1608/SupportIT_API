import { MESSAGE_CODES } from "@common/constants";
import { env } from "@environments";
import { Injectable } from "@nestjs/common";
import { ThrottlerModuleOptions, ThrottlerOptionsFactory } from "@nestjs/throttler";
import Redis from "ioredis";
import { ThrottlerStorageRedisService } from "nestjs-throttler-storage-redis";

@Injectable()
export class ThrottlerConfig implements ThrottlerOptionsFactory {
    constructor() {}

    createThrottlerOptions(): ThrottlerModuleOptions {
        return {
            throttlers: [
                {
                    limit: env.rateLimit.THROTTLE_LIMIT,
                    ttl: env.rateLimit.THROTTLE_TTL
                }
            ],
            storage: new ThrottlerStorageRedisService(new Redis(env.redis.URL, { keyPrefix: env.redis.GLOBAL_PREFIX || "" })),
            errorMessage: MESSAGE_CODES.T0O_MANY_REQUESTS
        };
    }
}
