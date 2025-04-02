import { CodeResponseEnum } from "@common/enums";
import { env } from "@environments";
import { IAuthPayload } from "@modules/auth/interfaces";
import { logger } from "@modules/logger";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { BloomFilter } from "bloom-filters";
import { UserRepository } from "./repositories";

@Injectable()
export class UserService {
    private userBloomFilter: BloomFilter;
    private userEmailBloomFilter: BloomFilter;

    constructor(
        private readonly userRepository: UserRepository
    ) {
        this.initBloomFilter();
    }

    private async initBloomFilter() {
        this.userBloomFilter = BloomFilter.create(env.bloomFilter.SIZE, env.bloomFilter.FALSE_POSITIVE_RATE);
        this.userEmailBloomFilter = BloomFilter.create(env.bloomFilter.SIZE, env.bloomFilter.FALSE_POSITIVE_RATE);

        try {
            const users = await this.userRepository.findAndCustomSelect({}, { walletAddress: 1, email: 1 });
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

    async getUserBloomFilter(walletAddress: string) {
        return this.userBloomFilter.has(walletAddress.toLowerCase());
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
    }) {
        const { email, name, avatar, googleAccessToken, googleRefreshToken } = request;

        try {
            const existingUser = await this.userRepository.findOne({ email: email });

            if (!existingUser) {
                const user = await this.userRepository.create({
                    email: email,
                    loginTime: 1,
                    lastLoginDate: new Date(),
                    name: name || email.split("@")[0],
                    avatar,
                    googleAccessToken,
                    googleRefreshToken
                });

                if (email) {
                    this.userEmailBloomFilter.add(email.toLowerCase());
                }
                return user;
            }

            await this.userRepository.findOneAndUpdate(
                { email: email },
                {
                    $inc: { loginTime: 1 },
                    $set: { lastLoginDate: new Date() }
                }
            );

            return existingUser;
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
