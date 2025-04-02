import { RedisModule } from "@modules/redis";
import { Module } from "@nestjs/common";
import { GoogleService } from "./google.service";
import { GoogleOAuth2Strategy } from "./strategies";

@Module({
    imports: [RedisModule],
    providers: [GoogleService, GoogleOAuth2Strategy],
    exports: [GoogleService]
})
export class GoogleModule {}
