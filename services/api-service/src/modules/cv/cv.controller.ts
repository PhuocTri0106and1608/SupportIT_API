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
@UseGuards(AuthGuard, AnyRoleGuard)
@AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER, LoginRoleEnum.ADMIN)
export class CVController {
  constructor(
    private readonly cvService: CVService,
    private readonly mediaService: MediaService
  ) { }

  @Post("reviewCV")
  async reviewCV(@CurrentUser() user, @Body() request: CVDto): Promise<ResponseType> {
    return this.cvService.saveCV({ cv: request, userId: user.id });
  }

  @ApiConsumes("multipart/form-data")
  @ApiBody({
    type: UploadFileDto
  })
  @UseInterceptors(FileInterceptor("file"))
  @Post("uploadCV")
  @ApiOkResponse({ type: ResponseType<{ fileUrl: string }> })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1_000_000 }), new FileTypeValidator({ fileType: /application\/(pdf|doc|docx)/ })]
      })
    )
    file: Express.Multer.File
  ): Promise<ResponseType<{ fileUrl: string }>> {
    return await this.mediaService.uploadFileToPublicBucket("support-it/cv", {
      file: file,
      fileName: file.originalname
    });
  }

  @UseInterceptors(FileInterceptor("file"))
  @Delete("deleteFile")
  @ApiOkResponse({ type: ResponseType })
  async deleteFile(@Body() body: DeleteFileDto): Promise<ResponseType> {
    return await this.mediaService.deleteFileFromPublicBucket(body.key);
  }

}
