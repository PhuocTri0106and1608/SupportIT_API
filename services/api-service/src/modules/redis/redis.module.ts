import { Module } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Module({
    imports: [],
    controllers: [],
    exports: [RedisService],
    providers: [RedisService]
})
export class RedisModule {}
