import { AnyRole, ApiOkResponseCustom, CheckAbilites, CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { IAuthPayload } from "@modules/auth/interfaces";
import { Body, Controller, Delete, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { AdminActionEnum, CodeResponseEnum, LoginRoleEnum, SubjectEnum } from "@common/enums";
import { AdminAbilitiesGuard } from "@modules/admin/guards";
import { AnyRoleGuard, JwtAccessTokenAuthGuard } from "@modules/auth/guards";
import { TokenPayloadAdminDto } from "@modules/admin/dtos";
import { ResponseType } from "@common/dtos";
import { FilterCandidateListDto, FilterRecruiterListDto, UpdateAvatarRequestDto } from "./dtos";
import { DeleteFileDto, UploadFileDto } from "@modules/media/dtos";
import { FileInterceptor } from "@nestjs/platform-express";
import { MediaService } from "@modules/media";

@Controller("users")
@ApiTags("Users")
@ApiBearerAuth("access-token")
export class UserController {
    constructor(private readonly userService: UserService,
        private readonly mediaService: MediaService
    ) { }

    @Get("getUserProfile")
    @UseGuards(AuthGuard, AnyRoleGuard)
    @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
    async getProfile(@CurrentUser() user: IAuthPayload) {
        return {
            code: CodeResponseEnum.SUCCESS,
            data: this.userService.getProfile(user)
        };
    }

    @Post("updateAvatar")
    @UseGuards(AuthGuard, AnyRoleGuard)
    @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
    async updateAvatar(@CurrentUser() user: IAuthPayload, @Body() body: UpdateAvatarRequestDto) {
        return {
            code: CodeResponseEnum.SUCCESS,
            data: this.userService.updateAvatar(user, body.avatar)
        };
    }

    @Put('grant-recruiter/:email')
    @CheckAbilites({ action: AdminActionEnum.UPDATE, subject: SubjectEnum.RECRUITERS })
    @UseGuards(JwtAccessTokenAuthGuard, AdminAbilitiesGuard)
    @ApiOkResponseCustom(ResponseType)
    async grantRecruiterPermission(
        @Param('email') email: string,
        @CurrentUser() admin: TokenPayloadAdminDto
    ) {
        return this.userService.grantRecruiterPermission(email, admin);
    }

    @Get('candidates')
    @CheckAbilites({ action: AdminActionEnum.READ, subject: SubjectEnum.CANDIDATES })
    @UseGuards(JwtAccessTokenAuthGuard, AdminAbilitiesGuard)
    @ApiOkResponseCustom(ResponseType)
    async getCandidateList(
        @Query() dto: FilterCandidateListDto
    ) {
        return this.userService.getCandidateList(dto);
    }

    @Get('recruiters')
    @CheckAbilites({ action: AdminActionEnum.READ, subject: SubjectEnum.RECRUITERS })
    @UseGuards(JwtAccessTokenAuthGuard, AdminAbilitiesGuard)
    @ApiOkResponseCustom(ResponseType)
    async getRecruiterList(
        @Query() dto: FilterRecruiterListDto
    ) {
        return this.userService.getRecruiterList(dto);
    }

    @ApiConsumes('multipart/form-data')
    @ApiBody({
        type: UploadFileDto,
    })
    @UseGuards(AuthGuard, AnyRoleGuard)
    @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
    @UseInterceptors(FileInterceptor('file'))
    @Post('uploadAvatarImage')
    @ApiOkResponse({
        description: 'Upload image to Cloudinary',
        type: ResponseType<{ imageUrl: string; publicId: string }>,
    })
    async uploadImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 2_000_000 }), // 2MB
                    new FileTypeValidator({
                        fileType: /image\/(jpeg|png|jpg|webp)/,
                    }),
                ],
            }),
        )
        file: Express.Multer.File,
    ): Promise<ResponseType<{ imageUrl: string; publicId: string }>> {
        return this.mediaService.uploadFileToPublicBucket('support-it/avatars', {
            file: file,
            fileName: file.originalname,
        });
    }

    @Delete('deleteAvatarImage')
    @UseGuards(AuthGuard, AnyRoleGuard)
    @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
    @ApiOkResponse({ type: ResponseType })
    async deleteFile(@Body() body: DeleteFileDto): Promise<ResponseType> {
        return this.mediaService.deleteFileFromPublicBucket(body.key);
    }
}
