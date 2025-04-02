import { AdminActionEnum, AdminRoleEnum, SubjectEnum } from "@common/enums";
import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateNested } from "class-validator";

export class PermissionsRequestDto {
    @ApiProperty({ enum: SubjectEnum })
    @IsEnum(SubjectEnum)
    subject: string;

    @ApiProperty({ enum: AdminActionEnum })
    @IsEnum(AdminActionEnum)
    action: string;
}

export class AdminLoginRequestDto {
    @ApiProperty({ example: "admin" })
    @IsEmail()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ example: "admin" })
    @IsNotEmpty()
    readonly password: string;
}

export class AdminLoginResponseDto {
    @ApiResponseProperty()
    @IsString()
    @IsNotEmpty()
    readonly accessToken: string;
}

export class CreateAdminDto {
    @ApiProperty()
    @IsString()
    @MaxLength(50)
    name: string;

    @ApiProperty()
    @IsString()
    @MaxLength(50)
    email: string;

    @ApiProperty()
    // @IsStrongPassword()
    password: string;

    @ApiProperty()
    @Matches(/^(\+?\d{1,4})?\d{7,10}$/, {
        message: "Invalid phone number."
    })
    @IsNotEmpty()
    phoneNumber: string;

    @ApiProperty({ enum: AdminRoleEnum })
    @IsEnum(AdminRoleEnum)
    role: string;

    @ApiProperty({ type: [PermissionsRequestDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PermissionsRequestDto)
    permissions: PermissionsRequestDto[];
}

export class TokenPayloadAdminDto extends CreateAdminDto {
    @IsOptional()
    _id?: string;
}
