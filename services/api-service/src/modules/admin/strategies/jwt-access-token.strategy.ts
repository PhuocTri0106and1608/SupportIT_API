import { env } from "@environments";
import { AdminService } from "@modules/admin/services";
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ITokenPayload } from "../interfaces";

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy, "jwt-access-token") {
    constructor(private readonly adminService: AdminService) {
        const privateKey = env.jwt.access.SECRET;
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: `${privateKey}`
        });
    }

    async validate(payload: ITokenPayload) {
        return (await this.adminService.findOneAdminById(payload._id)).data;
    }
}
