import { ApiOkResponseCustom, CheckAbilites, CurrentUser } from "@common/decorators";
import { ResponseType } from "@common/dtos";
import { AdminActionEnum, SubjectEnum } from "@common/enums";
import { JwtAccessTokenAuthGuard } from "@modules/auth/guards";
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
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
        return this.adminService.signUpAdminAccount(user);
    }

    @CheckAbilites({ action: AdminActionEnum.READ, subject: SubjectEnum.ADMINS })
    @UseGuards(JwtAccessTokenAuthGuard, AdminAbilitiesGuard)
    @Get("getAdminInfo")
    @ApiOkResponseCustom(ResponseType, AdminResponseDto)
    async getAdminInfo(@CurrentUser() adminInfo: TokenPayloadAdminDto): Promise<ResponseType> {
        return this.adminService.findOneAdminById(adminInfo._id);
    }

    @Post("login")
    @UseGuards(LocalAuthGuard)
    @ApiBody({ type: AdminLoginRequestDto })
    @ApiOkResponseCustom(ResponseType, AdminLoginResponseDto)
    async signInAdminAccount(@CurrentUser() adminInfo: TokenPayloadAdminDto) {
        return this.adminService.loginAdmin(adminInfo);
    }
}
