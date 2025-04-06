import { OAuthProvidersEnum } from "@common/enums";
import { env } from "@environments";
import { logger } from "@modules/logger";
import { RedisService } from "@modules/redis";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { v4 as uuidv4 } from "uuid";
import { GoogleModule } from "../google.module";
import { IUserExternalProfile } from "../interfaces";

@Injectable()
export class GoogleOAuth2RecruiterStrategy extends PassportStrategy(Strategy, "google-recruiter") {
    constructor(private readonly redisService: RedisService) {
        super({
            authorizationURL: env.oauth2[OAuthProvidersEnum.GOOGLE].AUTHORIZATION_URL,
            tokenURL: env.oauth2[OAuthProvidersEnum.GOOGLE].TOKEN_URL,
            clientID: env.oauth2[OAuthProvidersEnum.GOOGLE].CLIENT_ID,
            clientSecret: env.oauth2[OAuthProvidersEnum.GOOGLE].CLIENT_SECRET,
            callbackURL: env.oauth2[OAuthProvidersEnum.GOOGLE].RECRUITER_REDIRECT_URL,
            scope: ["profile", "email"],
            // CSRF
            state: false,
            passReqToCallback: true
        });
    }

    async generateState(preAuthData: {  }): Promise<string> {
        const state = uuidv4();
        await this.redisService.set(`:${GoogleModule.name}:${OAuthProvidersEnum.GOOGLE}:${state}`, preAuthData, { ttl: 10 * 60 }); // Expires in 10 minutes
        return state;
    }

    async getAuthorizeUrl(preAuthData: { }): Promise<string> {
        const state = await this.generateState(preAuthData);
        const params = new URLSearchParams({
            response_type: "code",
            client_id: env.oauth2[OAuthProvidersEnum.GOOGLE].CLIENT_ID,
            redirect_uri: env.oauth2[OAuthProvidersEnum.GOOGLE].RECRUITER_REDIRECT_URL,
            scope: "profile email",
            state: state,
            prompt: "consent",
            access_type: "offline"
        });

        return `${env.oauth2[OAuthProvidersEnum.GOOGLE].AUTHORIZATION_URL}?${params.toString()}`;
    }

    async validate(req: Request, accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        try {
            const { name, emails, photos } = profile;

            const user: IUserExternalProfile = {
                email: emails[0].value,
                name: `${name.givenName} ${name.familyName}`,
                avatar: photos[0].value,
                accessToken,
                refreshToken
            };

            done(null, user);
        } catch (error) {
            throw new UnauthorizedException(error.message);
        }
    }

    async getUserInfo(accessToken: string): Promise<any> {
        try {
            const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new BadRequestException("Failed to fetch user info from Google");
            }

            return await response.json();
        } catch (error) {
            logger.error(`Error fetching Google user info: ${error.message}`, error.stack);
            throw new BadRequestException("Failed to fetch user info from Google");
        }
    }

    async refreshAccessToken(refreshToken: string): Promise<any> {
        try {
            const params = new URLSearchParams({
                client_id: env.oauth2[OAuthProvidersEnum.GOOGLE].CLIENT_ID,
                client_secret: env.oauth2[OAuthProvidersEnum.GOOGLE].CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: "refresh_token"
            });

            const response = await fetch(env.oauth2[OAuthProvidersEnum.GOOGLE].TOKEN_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: params.toString()
            });

            if (!response.ok) {
                throw new BadRequestException("Failed to refresh Google access token");
            }

            return await response.json();
        } catch (error) {
            logger.error(`Error refreshing Google access token: ${error.message}`, error.stack);
            throw new BadRequestException("Failed to refresh Google access token");
        }
    }

    async revokeToken(token: string): Promise<any> {
        try {
            const params = new URLSearchParams({
                token: token
            });

            const response = await fetch(`https://oauth2.googleapis.com/revoke?${params.toString()}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            if (!response.ok) {
                throw new BadRequestException("Failed to revoke Google token");
            }

            return { success: true };
        } catch (error) {
            logger.error(`Error revoking Google token: ${error.message}`, error.stack);
            throw new BadRequestException("Failed to revoke Google token");
        }
    }
}
