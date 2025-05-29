import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SignUpRequestDto {
    @ApiProperty({ example: "a@gmail.com" })
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiPropertyOptional({ example: "HR Manager" })
    @IsString()
    @IsOptional()
    position?: string;

    @ApiProperty({ example: "ABC Company" })
    @IsNotEmpty()
    @IsString()
    companyName: string;

    @ApiPropertyOptional({ example: "abc.com" })
    @IsString()
    @IsOptional()
    companyWebsite?: string;
}
