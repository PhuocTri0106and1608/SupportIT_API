import { CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { IAuthPayload } from "@modules/auth/interfaces";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";

@Controller("users")
@ApiTags("Users")
@ApiBearerAuth("access-token")
@UseGuards(AuthGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get("getUserProfile")
    async getProfile(@CurrentUser() user: IAuthPayload) {
        return this.userService.getProfile(user);
    }
}
