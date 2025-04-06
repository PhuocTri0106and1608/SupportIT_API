import { SetMetadata } from "@nestjs/common";
import { LoginRoleEnum } from "@common/enums";

export const ANY_ROLE_KEY = "any-role";
export const AnyRole = (...roles: LoginRoleEnum[]) => SetMetadata(ANY_ROLE_KEY, roles); 