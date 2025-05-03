import { AnyRole, ApiOkResponseCustom, CheckAbilites, CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { IAuthPayload } from "@modules/auth/interfaces";
import { Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { AdminActionEnum, LoginRoleEnum, SubjectEnum } from "@common/enums";
import { AdminAbilitiesGuard } from "@modules/admin/guards";
import { AnyRoleGuard, JwtAccessTokenAuthGuard } from "@modules/auth/guards";
import { TokenPayloadAdminDto } from "@modules/admin/dtos";
import { ResponseType } from "@common/dtos";

@Controller("users")
@ApiTags("Users")
@ApiBearerAuth("access-token")
export class UserController {
    constructor(private readonly userService: UserService) {}
    
    @Get("getUserProfile")
    @UseGuards(AuthGuard, AnyRoleGuard)
    @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
    async getProfile(@CurrentUser() user: IAuthPayload) {
        return this.userService.getProfile(user);
    }

    @Put('grant-recruiter/:email')
    @CheckAbilites({ action: AdminActionEnum.UPDATE, subject: SubjectEnum.RECRUITERS })
    @UseGuards(JwtAccessTokenAuthGuard, AdminAbilitiesGuard)
    @ApiOkResponseCustom(ResponseType)
    async grantRecruiterPermission(
        @Param('email') email: string,
        @CurrentUser() admin: TokenPayloadAdminDto
    ){
        return await this.userService.grantRecruiterPermission(email, admin);
    }
}
