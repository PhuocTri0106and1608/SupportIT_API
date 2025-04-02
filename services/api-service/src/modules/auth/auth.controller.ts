import { CurrentUser } from "@common/decorators";
import { ResponseType } from "@common/dtos";
import { GoogleOAuth2Guard } from "@modules/google/guards";
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { LoginRequestDto, UserExternalProfileDto } from "./dtos";
import { IAuthPayload } from "./interfaces";

@ApiTags("Auth")
@ApiBearerAuth("access-token")
@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("login")
    @ApiOkResponse({ type: ResponseType })
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginRequestDto: LoginRequestDto) {
        return this.authService.login(loginRequestDto);
    }

    @Post("logout")
    @ApiOkResponse({ type: ResponseType })
    @HttpCode(HttpStatus.OK)
    public async logout(@CurrentUser() req: IAuthPayload) {
        return this.authService.logoutSession(req.id, req.sessionId);
    }

    @Get("google/callback")
    @UseGuards(GoogleOAuth2Guard)
    @HttpCode(HttpStatus.FOUND)
    async handleGoogleCallback(@CurrentUser() user: UserExternalProfileDto, @Res() res: Response) {
        return this.authService.handleGoogleCallback(user, res);
    }
}
