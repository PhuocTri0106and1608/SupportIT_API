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
import { FilterCandidateListDto, FilterRecruiterListDto } from "./dtos";
import { Types } from "mongoose";
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

            // Nếu là candidate thì tạo candidate profile
            if (role === LoginRoleEnum.CANDIDATE && !existingUser.roles.includes(LoginRoleEnum.CANDIDATE)) {
                await this.candidateRepository.create({ userId: existingUser._id.toString() });
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

    async updateAvatar(user: IAuthPayload, avatar: string): Promise<ResponseType> {
        try {
            await this.userRepository.findOneAndUpdate({ _id: new Types.ObjectId(user.id) }, { set: { avatar } });
            const profile = await this.getProfile(user);
            return {
                code: CodeResponseEnum.SUCCESS,
                data: profile
            };
        } catch (error) {
            throw new HttpException("updateAvatar error", HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: error,
            });
        }
    }

    async getProfile(request: IAuthPayload) {
        try {
            const { id, loginRole } = request;
            const user = await this.userRepository.findOne({ _id: id }, true, ["-googleAccessToken", "-googleRefreshToken"]);
            const extraInfo = loginRole === LoginRoleEnum.CANDIDATE ? await this.candidateRepository.findOne({ userId: id }) : await this.recruiterRepository.findOne({ userId: id });
            console.log("extraInfo", extraInfo);
            console.log("user", user);
            return {
                ...user,
                extraInfo
            };
        } catch (error) {
            throw new HttpException("getProfile error", HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: error,
            });
        }
    }

    async getCandidateList(query: FilterCandidateListDto): Promise<ResponseType> {
        const { page = 1, limit = 10, email, name } = query;
        const skip = (page - 1) * limit;

        try {
            const filter: any = {};
            const userFilter: any = {};

            if (email) userFilter.email = { $regex: email, $options: "i" };
            if (name) userFilter.name = { $regex: name, $options: "i" };

            const [candidates, total] = await Promise.all([
                this.candidateRepository.findWithPagination(filter, skip, limit),
                this.candidateRepository.countDocuments(filter),
            ]);

            const userIds = candidates.map(c => c.userId);
            const users = await this.userRepository.find({ _id: { $in: userIds }, ...userFilter });

            const userMap = new Map(users.map(user => [user._id.toString(), user]));
            const finalItems = candidates
                .filter(c => userMap.has(c.userId))
                .map(c => ({
                    ...c,
                    user: userMap.get(c.userId),
                }));

            return {
                code: CodeResponseEnum.SUCCESS,
                data: {
                    items: finalItems,
                    meta: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            };
        } catch (error) {
            throw new HttpException("getCandidateList error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
        }
    }
    

    async getRecruiterList(query: FilterRecruiterListDto): Promise<ResponseType> {
        const { page = 1, limit = 10, email, companyName } = query;
        const skip = (page - 1) * limit;

        try {
            const filter: any = {};
            if (companyName) filter.companyName = { $regex: companyName, $options: "i" };

            const [recruiters, total] = await Promise.all([
                this.recruiterRepository.findWithPagination(filter, skip, limit),
                this.recruiterRepository.countDocuments(filter),
            ]);

            const userIds = recruiters.map(r => r.userId);
            const userFilter: any = {};
            if (email) userFilter.email = { $regex: email, $options: "i" };

            const users = await this.userRepository.find({ _id: { $in: userIds }, ...userFilter });

            const userMap = new Map(users.map(user => [user._id.toString(), user]));
            const finalItems = recruiters
                .filter(r => userMap.has(r.userId))
                .map(r => ({
                    ...r,
                    user: userMap.get(r.userId),
                }));

            return {
                code: CodeResponseEnum.SUCCESS,
                data: {
                    items: finalItems,
                    meta: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            };
        } catch (error) {
            throw new HttpException("getRecruiterList error", HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
        }
    }
      
    
}
