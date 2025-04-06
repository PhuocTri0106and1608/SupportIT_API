import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { LoginRoleEnum } from "@common/enums";
import { IAuthPayload } from "../interfaces";
import { ANY_ROLE_KEY } from "@common/decorators";

@Injectable()
export class AnyRoleGuard {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<LoginRoleEnum[]>(ANY_ROLE_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as IAuthPayload;

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Kiểm tra xem user có ít nhất một role trong requiredRoles không
    const hasRequiredRole = user.roles?.some(role => requiredRoles.includes(role));

    if (!hasRequiredRole) {
      throw new UnauthorizedException("User does not have any of the required roles");
    }

    return true;
  }
} 