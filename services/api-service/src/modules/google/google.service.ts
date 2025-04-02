import { Injectable } from "@nestjs/common";
import { GoogleOAuth2Strategy } from "./strategies";

@Injectable()
export class GoogleService {
    constructor(private readonly googleOAuth2Strategy: GoogleOAuth2Strategy) {}

    async getOauth2AuthorUrl(preAuthData: { walletAddress?: string; referralCode?: string }): Promise<string> {
        return this.googleOAuth2Strategy.getAuthorizeUrl(preAuthData);
    }

    async getUserInfo(accessToken: string): Promise<any> {
        return this.googleOAuth2Strategy.getUserInfo(accessToken);
    }

    async refreshAccessToken(refreshToken: string): Promise<any> {
        return this.googleOAuth2Strategy.refreshAccessToken(refreshToken);
    }

    async revokePermission(token: string): Promise<any> {
        return this.googleOAuth2Strategy.revokeToken(token);
    }
}
