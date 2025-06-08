import { MESSAGE_CODES } from "@common/constants";
import { CodeResponseEnum, LoginRoleEnum, LoginStepEnum, LoginTypeEnum } from "@common/enums";
import { env } from "@environments";
import { EmailType, MailQueueService, EmailData } from "@modules/bull-queue";
import { GoogleService } from "@modules/google";
import { logger } from "@modules/logger";
import { RedisService } from "@modules/redis";
import { UserService } from "@modules/user";
import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import otpGenerator from "otp-generator";

@Injectable()
export class Web2AuthService {
    constructor(
        private readonly googleService: GoogleService,
        private readonly redisService: RedisService,
        private readonly userService: UserService,
        private readonly mailQueueService: MailQueueService
    ) { }

    async getLoginRequest(req: { type: LoginTypeEnum; data: any }, role: LoginRoleEnum) {
        try {
            switch (req.type) {
                case LoginTypeEnum.WEB2_EMAIL_OTP:
                    try {
                        return this.requestLoginEmailViaOtp(req.data.email);
                    } catch (error) {
                        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
                    }
                case LoginTypeEnum.WEB2_GOOGLE_OAUTH2:
                    const authUrl = await this.googleService.getOauth2AuthorUrl({}, role);

                    return {
                        code: CodeResponseEnum.SUCCESS,
                        data: {
                            nextStep: null,
                            requireDataFields: [],
                            data: {
                                authUrl
                            }
                        }
                    };
                default:
                    return {
                        code: CodeResponseEnum.ERROR,
                        message: MESSAGE_CODES.INVALID_LOGIN_TYPE
                    };
            }
        } catch (error) {
            throw new HttpException("getLoginRequest error", HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: error
            });
        }
    }

    async verifyLoginRequest(req: { type: LoginTypeEnum; data: any }) {
        try {
            switch (req.type) {
                case LoginTypeEnum.WEB2_EMAIL_OTP:
                    return this.verifyLoginEmailViaOtp({
                        otp: req.data.otp,
                        email: req.data.email
                    });
                case LoginTypeEnum.WEB2_GOOGLE_OAUTH2:
                    return this.verifyLoginOauth2(req.data);
                default:
                    return {
                        code: CodeResponseEnum.ERROR,
                        message: MESSAGE_CODES.INVALID_LOGIN_TYPE,
                        data: null
                    };
            }
        } catch (error) {
            throw new HttpException("verifyLoginRequest error", HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: error
            });
        }
    }

    private async requestLoginEmailViaOtp(email: string) {
        const otp = otpGenerator.generate(env.otp.LENGTH, { upperCaseAlphabets: false, specialChars: false, digits: true, lowerCaseAlphabets: false });
        await this.redisService.set(`mail:${email}:otp`, otp, { ttl: env.otp.LIFE });

        const emailData: EmailData = {
            to: email,
            otp: otp
        };

        const isAdded = await this.mailQueueService.addToQueue(EmailType.OTP, emailData);

        if (!isAdded.result) {
            logger.error(`Failed to add email job to queue: ${isAdded.error}`);
            return {
                code: CodeResponseEnum.ERROR,
                message: MESSAGE_CODES.SEND_MAIL_ERROR
            };
        }

        return {
            code: CodeResponseEnum.SUCCESS,
            data: {
                nextStep: LoginStepEnum.VERIFY,
                requireDataFields: ["email", "otp"]
            }
        };
    }

    async verifyLoginEmailViaOtp(request: { otp: string; email: string }) {
        const normalizedEmail = request.email.toLowerCase();

        const cachedOtpData = await this.redisService.get(`mail:${normalizedEmail}:otp`);

        if (!cachedOtpData) {
            throw new BadRequestException(MESSAGE_CODES.OTP_INVALID);
        }

        if (Number(cachedOtpData) !== Number(request.otp)) {
            throw new BadRequestException(MESSAGE_CODES.OTP_INVALID);
        }

        this.redisService.del(`mail:${normalizedEmail}:otp`).catch((err) => logger.error(`Failed to delete OTP: ${err.message}`));

        // const mayExistResult = await this.userService.getUserEmailBloomFilter(normalizedEmail);

        return {
            code: CodeResponseEnum.SUCCESS,
            data: {
                email: normalizedEmail,
                name: "",
                avatar: "",
            }
        };
    }

    async verifyLoginOauth2(data: { email: string; name: string; avatar: string; accessToken?: string; refreshToken?: string }) {
        const normalizedEmail = data.email.toLowerCase();
        return {
            code: CodeResponseEnum.SUCCESS,
            data: {
                name: data.name,
                avatar: data.avatar,
                googleAccessToken: data?.accessToken,
                googleRefreshToken: data?.refreshToken,
                email: normalizedEmail
            }
        };
    }
}
