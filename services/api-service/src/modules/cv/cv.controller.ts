import { AnyRole, CurrentUser } from "@common/decorators";
import { AuthGuard } from "@common/guards";
import { Controller, Get, UseGuards, Post, Body, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Param, Query, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { CVService } from "./cv.service";
import { ResponseType } from "@common/dtos";
import { DeleteFileDto, UploadFileDto } from "@modules/media/dtos";
import { MediaService } from "@modules/media/media.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { AnyRoleGuard } from "@modules/auth/guards";
import { LoginRoleEnum } from "@common/enums";
import { CreateJdDto, CVUploadDto, FilterApplicationsRequestDto, FilterCVsRequestDto, FilterEvaluationsRequestDto, FilterJDsRequestDto, UpdateApplicationStatusDto, UpdateJdDto } from "./dtos";
import { IAuthPayload } from "@modules/auth/interfaces";

@Controller("cvs")
@ApiTags("CVs")
@ApiBearerAuth("access-token")
// @UseGuards(AuthGuard, AnyRoleGuard)
export class CVController {
  constructor(
    private readonly cvService: CVService,
    private readonly mediaService: MediaService
  ) { }
  @Post('uploadJD')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  async uploadJD(
    @CurrentUser() user: IAuthPayload,
    @Body() jd: CreateJdDto
  ): Promise<ResponseType> {
    return this.cvService.uploadJD({ jd, userId: user.id, role: user.loginRole });
  }

  @Patch('updateJD/:jdId')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  async updateJD(
    @CurrentUser() user: IAuthPayload,
    @Param('jdId') jdId: string,
    @Body() jd: UpdateJdDto
  ): Promise<ResponseType> {
    return this.cvService.updateJD({ jdId, jd, userId: user.id, role: user.loginRole });
  }

  @Post('uploadCV')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  async uploadCV(
    @CurrentUser() user,
    @Body() cv: CVUploadDto
  ): Promise<ResponseType> {
    return this.cvService.uploadCV({ cv, userId: user.id });
  }

  @Patch('application/:id/status')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateApplicationStatusDto,
    @CurrentUser() user
  ): Promise<ResponseType> {
    return this.cvService.updateApplicationStatus(id, updateStatusDto.status, user.id);
  }

  @Post("reviewCV/:cvId/:jdId")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  async reviewCV(@CurrentUser() user, @Param("cvId") cvId: string, @Param("jdId") jdId: string): Promise<ResponseType> {
    return this.cvService.reviewCV({ userId: user.id, cvId, jdId });
  }

  @Post("applyCV/:cvId/:jdId")
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  async applyCV(@CurrentUser() user, @Param("cvId") cvId: string, @Param("jdId") jdId: string): Promise<ResponseType> {
    return this.cvService.applyCV({ userId: user.id, cvId, jdId });
  }

  // Endpoint để lấy danh sách Applications
  @Get('list-applications')
  async getListApplications(@Query() query: FilterApplicationsRequestDto): Promise<ResponseType> {
    return this.cvService.getListApplications(query);
  }

  // Endpoint để lấy danh sách CVs
  @Get('list-cvs')
  async getListCVs(@Query() query: FilterCVsRequestDto): Promise<ResponseType> {
    return this.cvService.getListCVs(query);
  }

  // Endpoint để lấy danh sách Evaluations
  @Get('list-evaluations')
  async getListEvaluations(@Query() query: FilterEvaluationsRequestDto): Promise<ResponseType> {
    return this.cvService.getListEvaluations(query);
  }

  // Endpoint để lấy danh sách JDs
  @Get('list-jds')
  async getListJDs(@Query() query: FilterJDsRequestDto): Promise<ResponseType> {
    return this.cvService.getListJDs(query);
  }

  // Endpoint để lấy thông tin Application theo ID
  @Get('application/:id')
  async getApplicationById(@Param('id') id: string): Promise<ResponseType> {
    return this.cvService.getApplicationById(id);
  }

  // Endpoint để lấy thông tin CV theo ID
  @Get('cv/:id')
  async getCVById(@Param('id') id: string): Promise<ResponseType> {
    return this.cvService.getCVById(id);
  }

  // Endpoint để lấy thông tin Evaluation theo ID
  @Get('evaluation/:id')
  async getEvaluationById(@Param('id') id: string): Promise<ResponseType> {
    return this.cvService.getEvaluationById(id);
  }

  // Endpoint để lấy thông tin JD theo ID
  @Get('jd/:id')
  async getJDById(@Param('id') id: string): Promise<ResponseType> {
    return this.cvService.getJDById(id);
  }

  // Endpoint để xóa JD theo ID
  @Delete('delete-jd/:id')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.RECRUITER)
  async deleteJD(@Param('id') id: string): Promise<ResponseType> {
    return this.cvService.deleteJD(id);
  }

  // Endpoint để xóa CV theo ID
  @Delete('delete-cv/:id')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  async deleteCV(@Param('id') id: string): Promise<ResponseType> {
    return this.cvService.deleteCV(id);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFileDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  @Post('uploadFile')
  @ApiOkResponse({
    description: 'Upload file to Cloudinary',
    type: ResponseType<{ imageUrl: string; publicId: string }>,
  })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1_000_000 }), // 1MB
          new FileTypeValidator({
            fileType: /application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)|application\/octet-stream/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ResponseType<{ imageUrl: string; publicId: string }>> {
    return this.mediaService.uploadFileToPublicBucket('files', {
      file: file,
      fileName: file.originalname,
    });
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFileDto,
  })
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
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
    return this.mediaService.uploadFileToPublicBucket('images', {
      file: file,
      fileName: file.originalname,
    });
  }

  @Delete('deleteFile')
  @UseGuards(AuthGuard, AnyRoleGuard)
  @AnyRole(LoginRoleEnum.CANDIDATE, LoginRoleEnum.RECRUITER)
  @ApiOkResponse({ type: ResponseType })
  async deleteFile(@Body() body: DeleteFileDto): Promise<ResponseType> {
    return this.mediaService.deleteFileFromPublicBucket(body.key);
  }
}



