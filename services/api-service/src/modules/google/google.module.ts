import { RedisModule } from "@modules/redis";
import { Module } from "@nestjs/common";
import { GoogleService } from "./google.service";
import { GoogleOAuth2CandidateStrategy, GoogleOAuth2RecruiterStrategy } from "./strategies";

@Module({
    imports: [RedisModule],
    providers: [GoogleService, GoogleOAuth2CandidateStrategy, GoogleOAuth2RecruiterStrategy],
    exports: [GoogleService]
})
export class GoogleModule {}
