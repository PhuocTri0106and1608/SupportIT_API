import { LoginProviderEnum, LoginRoleEnum, LoginStepEnum, LoginTypeEnum } from "@common/enums";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsEnum, IsObject, IsOptional, IsString } from "class-validator";
import { UserExternalProfileDto } from "./auth.dto";

export class LoginRequest_DataDto extends PartialType(UserExternalProfileDto) {
    @IsOptional()
    @IsString()
    otp?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsEnum(LoginRoleEnum)
    role?: LoginRoleEnum;
}

export class LoginRequestDto {
    @ApiProperty({
        enum: LoginStepEnum,
        example: LoginStepEnum.REQUEST
    })
    @IsEnum(LoginStepEnum)
    step: LoginStepEnum;

    @ApiProperty({
        enum: LoginTypeEnum,
        example: LoginTypeEnum.WEB2_EMAIL_OTP
    })
    @IsEnum(LoginTypeEnum)
    type: LoginTypeEnum;

    @ApiProperty({
        type: LoginRequest_DataDto,
        example: {
            email: "test@test.com",
            otp: "123456"
        }
    })
    @IsOptional()
    @IsObject()
    @Type(() => LoginRequest_DataDto)
    data: LoginRequest_DataDto;
}
