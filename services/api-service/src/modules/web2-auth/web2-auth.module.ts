import { BullQueueModule } from "@modules/bull-queue";
import { GoogleModule } from "@modules/google";
import { RedisModule } from "@modules/redis";
import { UserModule } from "@modules/user";
import { Module } from "@nestjs/common";
import { Web2AuthService } from "./web2-auth.service";

@Module({
    imports: [GoogleModule, RedisModule, BullQueueModule, UserModule],
    providers: [Web2AuthService],
    exports: [Web2AuthService]
})
export class Web2AuthModule {}
