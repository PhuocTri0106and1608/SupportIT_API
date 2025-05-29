import { Prop } from "@nestjs/mongoose";
import { IsArray, IsOptional, IsString } from "class-validator";


export class BaseInformation {
  @IsArray()
  @IsString({ each: true })
  @Prop([String])
  experience: string[];

  @IsArray()
  @IsString({ each: true })
  @Prop([String])
  skills: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop([String])
  education?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop([String])
  projects?: string[];

  @IsOptional()
  @IsString()
  @Prop()
  summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop([String])
  certifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop([String])
  languages?: string[];
}