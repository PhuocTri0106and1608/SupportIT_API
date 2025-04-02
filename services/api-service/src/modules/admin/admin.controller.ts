import { ApiOkResponseCustom, CheckAbilites, CurrentUser } from "@common/decorators";
import { ResponseType } from "@common/dtos";
import { AdminActionEnum, SubjectEnum } from "@common/enums";
import { JwtAccessTokenAuthGuard } from "@modules/auth/guards";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiTags } from "@nestjs/swagger";
import { AdminLoginRequestDto, AdminLoginResponseDto, AdminResponseDto, CreateAdminDto, TokenPayloadAdminDto } from "./dtos";
import { AdminAbilitiesGuard, LocalAuthGuard } from "./guards";
import { AdminService } from "./services";

@ApiTags("Admins")
@ApiBearerAuth("access-token")
@Controller("admins")
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @CheckAbilites({ action: AdminActionEnum.MANAGE, subject: SubjectEnum.ADMINS })
    @UseGuards(JwtAccessTokenAuthGuard, AdminAbilitiesGuard)
    @Post("createAdmin")
    @ApiOkResponseCustom(ResponseType, AdminResponseDto)
    async signUpAdminAccount(@Body() user: CreateAdminDto): Promise<ResponseType> {
        return await this.adminService.signUpAdminAccount(user);
    }

    @Post("login")
    @UseGuards(LocalAuthGuard)
    @ApiBody({ type: AdminLoginRequestDto })
    @ApiOkResponseCustom(ResponseType, AdminLoginResponseDto)
    async signInAdminAccount(@CurrentUser() adminInfo: TokenPayloadAdminDto) {
        return await this.adminService.loginAdmin(adminInfo);
    }
}
