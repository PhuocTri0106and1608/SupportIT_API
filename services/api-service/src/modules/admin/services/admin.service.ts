import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";
import { env } from "@environments";
import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { CreateAdminDto, TokenPayloadAdminDto } from "../dtos";
import { AdminRepository } from "../repositories";

@Injectable()
export class AdminService {
    constructor(
        private readonly adminRepository: AdminRepository,
        private readonly jwtService: JwtService
    ) {}

    async getAdminByName(username: string): Promise<ResponseType> {
        const res = await this.adminRepository.findOne({ username });
        return { data: res, code: res ? CodeResponseEnum.SUCCESS : CodeResponseEnum.ERROR };
    }

    async findOneAdminById(_id: string): Promise<ResponseType> {
        const adminObj = await this.adminRepository.findById(_id);

        if (!adminObj) return { code: CodeResponseEnum.ERROR };

        delete adminObj.password;

        return { data: adminObj, code: CodeResponseEnum.SUCCESS };
    }

    async createAdmin(signUpDto: CreateAdminDto): Promise<ResponseType> {
        try {
            const newAdmin = await this.adminRepository.create(signUpDto);

            return { data: newAdmin, code: CodeResponseEnum.SUCCESS };
        } catch (error) {
            return { code: CodeResponseEnum.ERROR, message: error?.message, data: error };
        }
    }

    async signUpAdminAccount(user: CreateAdminDto): Promise<ResponseType> {
        const existedUser = await this.getAdminByName(user.name);
        if (existedUser && existedUser.data) {
            return { message: "Admin name already existed!!", code: CodeResponseEnum.ERROR };
        }
        const saltRounds = parseInt(env.admin.access.SALT_ROUND, 10);
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        const newAdmin = await this.createAdmin({ ...user, password: hashedPassword });

        if (newAdmin.code < CodeResponseEnum.SUCCESS) {
            return newAdmin;
        }

        return { data: newAdmin, code: CodeResponseEnum.SUCCESS };
    }

    async loginAdmin(dto: TokenPayloadAdminDto): Promise<ResponseType> {
        // ISSUE: (@an.hhm) select specific field in payload
        const accessToken = this.generateAccessToken({ ...dto });

        // await this.storeRefreshToken(userID, refresh_token);

        return {
            data: accessToken,
            code: CodeResponseEnum.SUCCESS
        };
    }

    async getAuthenticatedUser(name: string, password: string) {
        try {
            const user = (await this.getAdminByName(name)).data;

            await this.verifyPlainContentWithHashedContent(password, user.password);

            return user;
        } catch (error) {
            throw new HttpException("Wrong credentials!!", HttpStatus.BAD_REQUEST, { cause: error });
        }
    }

    private generateAccessToken(payload: TokenPayloadAdminDto) {
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

    private async verifyPlainContentWithHashedContent(plainText: string, hashedText: string) {
        const isMatching = await bcrypt.compare(plainText, hashedText);

        if (!isMatching) {
            throw new BadRequestException();
        }
    }
}
