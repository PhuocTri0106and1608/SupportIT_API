import { CodeResponseEnum, LoginRoleEnum } from "@common/enums";
import { env } from "@environments";
import { IAuthPayload } from "@modules/auth/interfaces";
import { logger } from "@modules/logger";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { BloomFilter } from "bloom-filters";
import { UserRepository } from "./repositories";
import { UserDocument } from "./schemas";
import { CandidateRepository } from "@modules/candidate/repositories";
import { ResponseType } from "@common/dtos";
import { TokenPayloadAdminDto } from '../admin/dtos/admin-request.dto';
import { AdminLogService } from "@modules/admin/services";
import { RecruiterRepository } from '../recruiter/repositories/recruiter.repository';
@Injectable()
export class UserService {
    private userBloomFilter: BloomFilter;
    private userEmailBloomFilter: BloomFilter;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly candidateRepository: CandidateRepository,
        private readonly recruiterRepository: RecruiterRepository,
        private readonly adminLogService: AdminLogService
    ) {
        this.initBloomFilter();
    }

    private async initBloomFilter() {
        this.userBloomFilter = BloomFilter.create(env.bloomFilter.SIZE, env.bloomFilter.FALSE_POSITIVE_RATE);
        this.userEmailBloomFilter = BloomFilter.create(env.bloomFilter.SIZE, env.bloomFilter.FALSE_POSITIVE_RATE);

        try {
            const users = await this.userRepository.findAndCustomSelect({}, { email: 1 });
            users.forEach((user) => {
                if (user.email) {
                    this.userEmailBloomFilter.add(user.email.toLowerCase());
                }
            });
            logger.info(`Wallet false positive rate: ${this.userBloomFilter.rate() * 100} %`);
            logger.info(`Email false positive rate: ${this.userEmailBloomFilter.rate() * 100} %`);
            logger.info(`Bloom filters initialized with ${users.length} users`);
        } catch (error) {
            logger.error(`Failed to initialize bloom filters: ${error.message}`);
        }
    }

    async getUserEmailBloomFilter(email: string) {
        return this.userEmailBloomFilter.has(email.toLowerCase());
    }

    async grantRecruiterPermission(email: string, admin: TokenPayloadAdminDto): Promise<ResponseType> {
        const recruiter = await this.userRepository.findOneAndUpdate({ email: email.toLowerCase() }, { canBeRecruiter: true });

        await this.adminLogService.createLog({
            adminId: admin._id,
            action: "GRANT_RECRUITER",
            body: { email },
            model: "User",
            currentData: JSON.stringify(recruiter)
        });

        return {
            code: CodeResponseEnum.SUCCESS,
            data: {
                _id: recruiter._id,
                email: recruiter.email,
                name: recruiter.name,
                avatar: recruiter.avatar,
                canBeRecruiter: true
            }
        }
    }

    async createOrUpdateUser(request: {
        email?: string;
        name?: string;
        avatar?: string;
        googleAccessToken?: string;
        googleRefreshToken?: string;
        role?: LoginRoleEnum;
    }): Promise<UserDocument> {
        const { email, name, avatar, googleAccessToken, googleRefreshToken, role } = request;

        if (!email) {
            throw new HttpException("Email is required", HttpStatus.BAD_REQUEST);
        }

        try {
            const existingUser = await this.userRepository.findOne({ email }, false);

            // Nếu user chưa tồn tại, tạo mới
            if (!existingUser) {

                const newUser = {
                    email,
                    loginTime: 1,
                    lastLoginDate: new Date(),
                    name: name || email.split("@")[0],
                    avatar,
                    googleAccessToken,
                    googleRefreshToken,
                    roles: [role],
                    canBeRecruiter: false, // Luôn mặc định là false khi tạo mới
                };

                const user = await this.userRepository.create(newUser) as UserDocument;

                // Nếu là candidate thì tạo candidate profile
                if (role === LoginRoleEnum.CANDIDATE) {
                    await this.candidateRepository.create({ userId: user._id.toString() });
                }

                if (email) {
                    this.userEmailBloomFilter.add(email.toLowerCase());
                }

                return user;
            }

            // Nếu user đã tồn tại, cập nhật thông tin
            const updatedRoles = [...(existingUser.roles || [])];

            if (role && !updatedRoles.includes(role)) {
                updatedRoles.push(role);
            }

            const updatedUser = await this.userRepository.findOneAndUpdate(
                { email },
                {
                    $inc: { loginTime: 1 },
                    $set: {
                        lastLoginDate: new Date(),
                        roles: updatedRoles,
                        avatar: avatar || existingUser.avatar,
                        name: name || existingUser.name,
                        googleAccessToken: googleAccessToken || existingUser.googleAccessToken,
                        googleRefreshToken: googleRefreshToken || existingUser.googleRefreshToken,
                    }
                },
                { new: true, upsert: false },
                false
            ) as UserDocument;

            return updatedUser;
        } catch (error) {
            throw new HttpException("createUser error", HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: error,
            });
        }
    }


    async getProfile(request: IAuthPayload): Promise<ResponseType> {
        const { id, loginRole } = request;
        const user = await this.userRepository.findOne({ _id: id }, true, ["-googleAccessToken", "-googleRefreshToken"]);
        const extraInfo = loginRole === LoginRoleEnum.CANDIDATE ? await this.candidateRepository.findOne({ userId: id }) : await this.recruiterRepository.findOne({ userId: id });
        return {
            code: CodeResponseEnum.SUCCESS,
            data: {
            ...user,
                extraInfo
            }
        };
    }
}
