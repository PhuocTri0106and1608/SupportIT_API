import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UploadFileDto {
    @ApiProperty({
        type: "string",
        format: "binary"
    })
    file: any;
}

export class DeleteFileDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    key: string;
}
