import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { LoginRoleEnum } from "@common/enums";
import { IAuthPayload } from "../interfaces";
import { ROLES_KEY } from "@common/decorators";

@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<LoginRoleEnum[]>(ROLES_KEY, [
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

    if (requiredRoles.includes(LoginRoleEnum.RECRUITER) && user.loginRole === LoginRoleEnum.RECRUITER && !user.canBeRecruiter) {
      throw new UnauthorizedException("User is not a recruiter");
    }

    // Kiểm tra xem user có tất cả các role được yêu cầu không
    const hasAllRequiredRoles = requiredRoles.every(requiredRole =>
      user.roles?.includes(requiredRole)
    );

    if (!hasAllRequiredRoles) {
      throw new UnauthorizedException("User does not have all required roles");
    }

    return true;
  }
} 