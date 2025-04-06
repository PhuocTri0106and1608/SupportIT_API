import { Injectable } from "@nestjs/common";
import { GoogleOAuth2CandidateStrategy, GoogleOAuth2RecruiterStrategy, GoogleOAuth2AdminStrategy } from "./strategies";
import { LoginRoleEnum } from "@common/enums";

@Injectable()
export class GoogleService {
    constructor(
        private readonly googleOAuth2CandidateStrategy: GoogleOAuth2CandidateStrategy,
        private readonly googleOAuth2RecruiterStrategy: GoogleOAuth2RecruiterStrategy,
        private readonly googleOAuth2AdminStrategy: GoogleOAuth2AdminStrategy
    ) { }

    async getOauth2AuthorUrl(preAuthData: {}, role: LoginRoleEnum): Promise<string> {
        switch (role) {
            case LoginRoleEnum.CANDIDATE:
                return this.googleOAuth2CandidateStrategy.getAuthorizeUrl(preAuthData);
            case LoginRoleEnum.RECRUITER:
                return this.googleOAuth2RecruiterStrategy.getAuthorizeUrl(preAuthData);
            case LoginRoleEnum.ADMIN:
                return this.googleOAuth2AdminStrategy.getAuthorizeUrl(preAuthData);
        }
    }

    async getUserInfo(accessToken: string, role: LoginRoleEnum): Promise<any> {
        switch (role) {
            case LoginRoleEnum.CANDIDATE:
                return this.googleOAuth2CandidateStrategy.getUserInfo(accessToken);
            case LoginRoleEnum.RECRUITER:
                return this.googleOAuth2RecruiterStrategy.getUserInfo(accessToken);
            case LoginRoleEnum.ADMIN:
                return this.googleOAuth2AdminStrategy.getUserInfo(accessToken);
        }
    }
    async refreshAccessToken(refreshToken: string, role: LoginRoleEnum): Promise<any> {
        switch (role) {
            case LoginRoleEnum.CANDIDATE:
                return this.googleOAuth2CandidateStrategy.refreshAccessToken(refreshToken);
            case LoginRoleEnum.RECRUITER:
                return this.googleOAuth2RecruiterStrategy.refreshAccessToken(refreshToken);
            case LoginRoleEnum.ADMIN:
                return this.googleOAuth2AdminStrategy.refreshAccessToken(refreshToken);
        }
    }
    async revokePermission(token: string, role: LoginRoleEnum): Promise<any> {
        switch (role) {
            case LoginRoleEnum.CANDIDATE:
                return this.googleOAuth2CandidateStrategy.revokeToken(token);
            case LoginRoleEnum.RECRUITER:
                return this.googleOAuth2RecruiterStrategy.revokeToken(token);
            case LoginRoleEnum.ADMIN:
                return this.googleOAuth2AdminStrategy.revokeToken(token);
        }
    }
}