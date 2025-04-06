import { SetMetadata } from "@nestjs/common";
import { LoginRoleEnum } from "@common/enums";

export const ROLES_KEY = "roles";
export const Roles = (...roles: LoginRoleEnum[]) => SetMetadata(ROLES_KEY, roles); 

