import { CodeResponseEnum, LoginRoleEnum } from "@common/enums";
import { env } from "@environments";
import { IAuthPayload } from "@modules/auth/interfaces";
import { logger } from "@modules/logger";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { BloomFilter } from "bloom-filters";
import { UserRepository } from "./repositories";
import { UserDocument } from "./schemas";
import { CandidateRepository } from "@modules/candidate/repositories";
@Injectable()
export class UserService {
    private userBloomFilter: BloomFilter;
    private userEmailBloomFilter: BloomFilter;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly candidateRepository: CandidateRepository
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

    async createOrUpdateUser(request: {
        email?: string;
        name?: string;
        avatar?: string;
        googleAccessToken?: string;
        googleRefreshToken?: string;
        role?: LoginRoleEnum;
    }): Promise<UserDocument> {
        const { email, name, avatar, googleAccessToken, googleRefreshToken, role } = request;

        try {
            const existingUser = await this.userRepository.findOne({ email: email }, false);

            if (!existingUser) {
                const newUser = {
                    email: email,
                    loginTime: 1,
                    lastLoginDate: new Date(),
                    name: name || email.split("@")[0],
                    avatar,
                    googleAccessToken,
                    googleRefreshToken,
                    roles: [role]
                };

                const user = await this.userRepository.create(newUser) as UserDocument;
                switch (role) {
                    case LoginRoleEnum.CANDIDATE:
                        await this.candidateRepository.create({ userId: user._id.toString() });
                        break;
                    default:
                        break;
                }

                if (email) {
                    this.userEmailBloomFilter.add(email.toLowerCase());
                }
                return user;
            }
            // switch (role) {
            //     case LoginRoleEnum.CANDIDATE:
            //         await this.candidateRepository.create({ userId: existingUser._id.toString() });
            //         break;
            //     default:
            //         break;
            // }
            const currentRoles = existingUser.roles || [];
            if (role && !currentRoles.includes(role)) {
                currentRoles.push(role);
            }

            const updatedUser = await this.userRepository.findOneAndUpdate(
                { email: email },
                {
                    $inc: { loginTime: 1 },
                    $set: {
                        lastLoginDate: new Date(),
                        roles: currentRoles,
                        avatar: avatar || existingUser.avatar,
                        name: name || existingUser.name,
                        googleAccessToken: googleAccessToken || existingUser.googleAccessToken,
                        googleRefreshToken: googleRefreshToken || existingUser.googleRefreshToken
                    }
                },
                { new: true, upsert: false },
                false
            ) as UserDocument;

            return updatedUser;
        } catch (error) {
            throw new HttpException("createUser error", HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: error
            });
        }
    }

    async getProfile(request: IAuthPayload) {
        const { id } = request;
        const user = await this.userRepository.findOne({ _id: id }, true, ["-googleAccessToken", "-googleRefreshToken"]);
        return {
            code: CodeResponseEnum.SUCCESS,
            data: {
                user
            }
        };
    }
}
