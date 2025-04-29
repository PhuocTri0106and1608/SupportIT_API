import { MESSAGE_CODES } from "@common/constants";
import { ResponseType } from "@common/dtos";
import { CodeResponseEnum, LoginProviderEnum, LoginRoleEnum, LoginStepEnum, LoginTypeEnum } from "@common/enums";
import { env } from "@environments";
import { logger } from "@modules/logger";
import { RedisService } from "@modules/redis";
import { UserService } from "@modules/user";
import { Web2AuthService } from "@modules/web2-auth";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { LoginRequestDto, SignUpRequestDto, UserExternalProfileDto } from "./dtos";
import { IAuthPayload } from "./interfaces";
import { RecruiterRepository } from '../recruiter/repositories/recruiter.repository';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly web2AuthService: Web2AuthService,
        private readonly userService: UserService,
        private readonly recruiterRepository: RecruiterRepository,
        private readonly redisService: RedisService
    ) { }

    async login(loginRequestDto: LoginRequestDto, role: LoginRoleEnum): Promise<ResponseType> {
        const { step, type, data } = loginRequestDto;

        switch (step) {
            case LoginStepEnum.REQUEST: {
                const getWeb2LoginRequest = await this.web2AuthService.getLoginRequest({
                    data,
                    type
                }, role);
                if (getWeb2LoginRequest.code !== CodeResponseEnum.SUCCESS) {
                    return getWeb2LoginRequest;
                }

                return {
                    code: CodeResponseEnum.SUCCESS,
                    data: {
                        provider: LoginProviderEnum.WEB2,
                        nextStep: getWeb2LoginRequest.data.nextStep,
                        data: getWeb2LoginRequest.data || null
                    }
                };
            }
            case LoginStepEnum.VERIFY: {
                const getWeb2LoginVerify = await this.web2AuthService.verifyLoginRequest({ data, type });

                if (getWeb2LoginVerify.code !== CodeResponseEnum.SUCCESS) {
                    return getWeb2LoginVerify;
                }

                const user = await this.userService.createOrUpdateUser({ ...getWeb2LoginVerify.data, role });
                const roles = user.roles || [];
                if (!roles.includes(role)) {
                    roles.push(role);
                }

                if (!user.canBeRecruiter && role === LoginRoleEnum.RECRUITER) {
                    return {
                        code: CodeResponseEnum.ERROR,
                        message: "User are not allowed to be a recruiter"
                    }
                }

                const sessionId = this.generateSessionId(user._id.toString(), role);
                const accessToken = this.generateAccessToken({
                    email: data.email,
                    id: user._id.toString(),
                    sessionId,
                    loginRole: role,
                    roles,
                    canBeRecruiter: user.canBeRecruiter,
                });
                console.log("Access token", accessToken);
                return {
                    code: CodeResponseEnum.SUCCESS,
                    data: {
                        accessToken
                    }
                };
            }
            default: {
                return {
                    code: CodeResponseEnum.ERROR,
                    message: MESSAGE_CODES.INVALID_STEP
                };
            }
        }
    }

    async signUpRecruiter(dto: SignUpRequestDto): Promise<ResponseType> {
        const { email } = dto;
    
        const user = await this.userService.createOrUpdateUser({
            email,
            role: LoginRoleEnum.RECRUITER
        });

        const recruiter = await this.recruiterRepository.create({
            ...dto,
            userId: user._id.toString()
        });
        return {
          code: CodeResponseEnum.SUCCESS,
          data: recruiter,
        };
      }
    

    async handleGoogleCallback(user: UserExternalProfileDto, res: Response, role: LoginRoleEnum) {
        try {
            const loginData = {
                provider: LoginProviderEnum.WEB2,
                data: user,
                step: LoginStepEnum.VERIFY,
                type: LoginTypeEnum.WEB2_GOOGLE_OAUTH2
            };

            const loginResponse = await this.login(loginData, role);

            const redirectUrl =
                loginResponse.code === CodeResponseEnum.SUCCESS
                    ? `${env.CLIENT_URL}?login_oauth2=true&token=${loginResponse.data.accessToken}`
                    : `${env.CLIENT_URL}?login_oauth2=false&error=${loginResponse.message}`;

            return res.redirect(redirectUrl);
        } catch (error) {
            logger.error(`Error handle Google callback: ${error.message}`, { error });
            return res.redirect(`${env.CLIENT_URL}?login_oauth2=false&error=server_error`);
        }
    }

    private generateAccessToken(payload: IAuthPayload) {
        try {
            const { SECRET, EXPIRES_IN } = env.jwt.access;

            return this.jwtService.sign(payload, {
                secret: SECRET,
                expiresIn: `${EXPIRES_IN}s`
            });
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
        }
    }

    private generateSessionId(userId: string, role: LoginRoleEnum) {
        const sessionId = uuidv4();
        const now = Date.now();
        const ttl = 60 * 60; // 1 hours in seconds

        const userSessionsKey = `user:${userId}:role:${role}:sessions`;

        this.saveSessionToRedis(userSessionsKey, sessionId, now, ttl).catch((error) => {
            logger.error(`Error save session to Redis: ${error.message}`, {
                userId,
                sessionId,
                error
            });
        });

        return sessionId;
    }

    private async saveSessionToRedis(userSessionsKey: string, sessionId: string, timestamp: number, ttl: number): Promise<void> {
        const pipeline = this.redisService.pipeline();

        pipeline.zadd(userSessionsKey, timestamp, sessionId);

        pipeline.expire(userSessionsKey, ttl);

        await pipeline.exec();
    }

    protected async validateSession(userId: string, sessionId: string, role: LoginRoleEnum): Promise<boolean> {
        const userSessionsKey = `user:${userId}:role:${role}:sessions`;
        const score = await this.redisService.zScore(userSessionsKey, sessionId);
        return score !== null;
    }

    async logoutSession(userId: string, sessionId: string, role: LoginRoleEnum): Promise<ResponseType> {
        const userSessionsKey = `user:${userId}:role:${role}:sessions`;

        await this.redisService.zRem(userSessionsKey, sessionId);

        return {
            code: CodeResponseEnum.SUCCESS
        };
    }
}
