import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";

export class UpdateApplicationStatusDto {
  @ApiProperty({
    enum: ["pending", "shortlisted", "rejected", "accepted"],
    description: "Status of the application",
  })
  @IsNotEmpty()
  @IsEnum(["pending", "shortlisted", "rejected", "accepted"])
  status: "pending" | "shortlisted" | "rejected" | "accepted";
} 