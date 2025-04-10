import { AnyRole, CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { Controller, Get, UseGuards, Post, Body, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { CVService } from "./cv.service";
import { CVDto } from "./dtos";
import { ResponseType } from "@common/dtos";
import { DeleteFileDto, UploadFileDto } from "@modules/media/dtos";
import { MediaService } from "@modules/media/media.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { AnyRoleGuard } from "@modules/auth/guards";
import { LoginRoleEnum } from "@common/enums";

@Controller("cvs")
@ApiTags("CVs")
@ApiBearerAuth("access-token")
// @UseGuards(AuthGuard, AnyRoleGuard)
// @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER, LoginRoleEnum.ADMIN)
export class CVController {
  constructor(
    private readonly cvService: CVService,
    private readonly mediaService: MediaService
  ) { }

  @Post("reviewCV")
  async reviewCV(@CurrentUser() user, @Body() request: CVDto): Promise<ResponseType> {
    return this.cvService.saveCV({ cv: request, userId: user.id });
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFileDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  @Post('uploadCV')
  @ApiOkResponse({
    description: 'Upload CV file to Cloudinary',
    type: ResponseType<{ imageUrl: string; publicId: string }>,
  })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1_000_000 }), // 1MB
          new FileTypeValidator({
            fileType: /application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ResponseType<{ imageUrl: string; publicId: string }>> {
    return await this.mediaService.uploadFileToPublicBucket('support-it/cv', {
      file: file,
      fileName: file.originalname,
    });
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFileDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  @Post('uploadImage')
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
    return await this.mediaService.uploadFileToPublicBucket('support-it/images', {
      file: file,
      fileName: file.originalname,
    });
  }

  @Delete('deleteFile')
  @ApiOkResponse({ type: ResponseType })
  async deleteFile(@Body() body: DeleteFileDto): Promise<ResponseType> {
    return await this.mediaService.deleteFileFromPublicBucket(body.key);
  }
}



