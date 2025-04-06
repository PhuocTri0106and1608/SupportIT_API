import { RedisModule } from "@modules/redis";
import { Module } from "@nestjs/common";
import { GoogleService } from "./google.service";
import { GoogleOAuth2CandidateStrategy, GoogleOAuth2RecruiterStrategy, GoogleOAuth2AdminStrategy } from "./strategies";

@Module({
    imports: [RedisModule],
    providers: [GoogleService, GoogleOAuth2CandidateStrategy, GoogleOAuth2RecruiterStrategy, GoogleOAuth2AdminStrategy],
    exports: [GoogleService]
})
export class GoogleModule {}
