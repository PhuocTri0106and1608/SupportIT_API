import { CurrentUser } from "@common/decorators";
import { ResponseType } from "@common/dtos";
import { GoogleOAuth2AdminGuard, GoogleOAuth2CandidateGuard, GoogleOAuth2RecruiterGuard } from "@modules/google/guards";
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { LoginRequestDto, UserExternalProfileDto } from "./dtos";
import { IAuthPayload } from "./interfaces";
import { AuthGuard } from "@common/guards";
import { LoginRoleEnum } from "@common/enums";
import { AnyRoleGuard } from "./guards";
import { AnyRole } from "@common/decorators";

@ApiTags("Auth")
@ApiBearerAuth("access-token")
@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("login/:role")
    @ApiOkResponse({ type: ResponseType })
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginRequestDto: LoginRequestDto, @Param("role") role: LoginRoleEnum) {
        return this.authService.login(loginRequestDto, role);
    }

    @Post("logout")
    @UseGuards(AuthGuard, AnyRoleGuard)
    @ApiOkResponse({ type: ResponseType })
    @HttpCode(HttpStatus.OK)
    @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER, LoginRoleEnum.ADMIN)
    public async logout(@CurrentUser() req: IAuthPayload) {
        return this.authService.logoutSession(req.id, req.sessionId);
    }

    @Get("google/callback/candidate")
    @UseGuards(GoogleOAuth2CandidateGuard)
    @HttpCode(HttpStatus.FOUND)
    async handleGoogleCallbackCandidate(@CurrentUser() user: UserExternalProfileDto, @Res() res: Response) {
        return this.authService.handleGoogleCallback(user, res, LoginRoleEnum.CANDIDATE);
    }

    @Get("google/callback/recruiter")
    @UseGuards(GoogleOAuth2RecruiterGuard)
    @HttpCode(HttpStatus.FOUND)
    async handleGoogleCallbackRecruiter(@CurrentUser() user: UserExternalProfileDto, @Res() res: Response) {
        return this.authService.handleGoogleCallback(user, res, LoginRoleEnum.RECRUITER);
    }

    @Get("google/callback/admin")
    @UseGuards(GoogleOAuth2AdminGuard)
    @HttpCode(HttpStatus.FOUND)
    async handleGoogleCallbackAdmin(@CurrentUser() user: UserExternalProfileDto, @Res() res: Response) {
        return this.authService.handleGoogleCallback(user, res, LoginRoleEnum.ADMIN);
    }

    // @Post("admin-only")
    // @UseGuards(JwtAccessTokenAuthGuard, RolesGuard)
    // @ApiOkResponse({ type: ResponseType })
    // @HttpCode(HttpStatus.OK)
    // @Roles(LoginRoleEnum.ADMIN)
    // public async adminOnly(@CurrentUser() req: IAuthPayload) {
    //     // Chỉ admin mới có thể truy cập endpoint này
    //     return { code: CodeResponseEnum.SUCCESS };
    // }

    // @Post("admin-or-recruiter")
    // @UseGuards(JwtAccessTokenAuthGuard, AnyRoleGuard)
    // @ApiOkResponse({ type: ResponseType })
    // @HttpCode(HttpStatus.OK)
    // @AnyRole(LoginRoleEnum.ADMIN, LoginRoleEnum.RECRUITER)
    // public async adminOrRecruiter(@CurrentUser() req: IAuthPayload) {
    //     // Admin hoặc Recruiter có thể truy cập endpoint này
    //     return { code: CodeResponseEnum.SUCCESS };
    // }
}
