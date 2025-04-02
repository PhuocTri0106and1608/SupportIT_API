import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AdminService } from "../services";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly adminService: AdminService) {
        super({ usernameField: "name" });
    }

    async validate(name: string, password: string) {
        const user = await this.adminService.getAuthenticatedUser(name, password);

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }
}
