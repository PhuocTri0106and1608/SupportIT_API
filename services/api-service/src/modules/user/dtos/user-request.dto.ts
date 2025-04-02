import { SLUG_REGEX } from "@common/constants";
import { ApiProperty } from "@nestjs/swagger";
import { isNull, isUndefined } from "@utils";
import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength, ValidateIf } from "class-validator";

export class CreateUserRequestDto {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @Matches(SLUG_REGEX, { message: "Username must be a valid slugs" })
    userName: string;

    @ApiProperty()
    @IsString()
    avatar: string;
}

export class UpdateUserDto {
    @IsString()
    @Length(3, 106)
    @Matches(SLUG_REGEX, {
        message: "Username must be a valid slugs"
    })
    @ValidateIf((o: UpdateUserDto) => !isUndefined(o.userName) || isUndefined(o.userName) || isNull(o.userName))
    readonly userName?: string;
}

export class ChangeEmailDto {
    @ApiProperty()
    @IsString()
    @MinLength(1)
    readonly password!: string;

    @ApiProperty()
    @IsString()
    @IsEmail()
    @Length(5, 255)
    readonly email: string;
}
