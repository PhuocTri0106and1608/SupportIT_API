import { AdminActionEnum, AdminRoleEnum, SubjectEnum } from "@common/enums";
import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

export class AdminPermissionsResponseDto {
    @ApiProperty({ enum: SubjectEnum })
    subject: string;

    @ApiProperty({ enum: AdminActionEnum })
    action: string;
}

@Exclude()
export class AdminResponseDto {
    @ApiResponseProperty()
    @Expose()
    readonly _id: string;

    @ApiResponseProperty()
    @Expose()
    readonly email: string;

    @ApiResponseProperty()
    @Expose()
    readonly name: string;

    @ApiResponseProperty()
    @Expose()
    readonly phoneNumber: string;

    @ApiResponseProperty({ enum: AdminRoleEnum })
    @Expose()
    role: string;

    @ApiResponseProperty({ type: [AdminPermissionsResponseDto] })
    @Expose()
    permissions: AdminPermissionsResponseDto[];

    @ApiResponseProperty()
    @Expose()
    readonly createdAt?: Date;

    @ApiResponseProperty()
    @Expose()
    readonly updatedAt?: Date;
}
