import { PageOptionsDto } from "@common/dtos";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class GetUsersRequestDto extends PageOptionsDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    userID?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;
}
