import { env } from "@environments";
import { RedisService } from "@modules/redis/redis.service";
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from "../decorators";
import { IAuthPayload } from "@modules/auth/interfaces";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private jwtService: JwtService,
        private redisService: RedisService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
        if (isPublic) {
            return true;
        }

        try {
            const { authToken } = this.extractCredentialFromHeader(request);

            const decoded: IAuthPayload = this.jwtService.verify(authToken, {
                secret: env.jwt.access.SECRET
            });

            if (!decoded || !decoded.sessionId || !decoded.id) {
                return false;
            }

            const userSessionsKey = `user:${decoded.id}:role:${decoded.loginRole}:sessions`;
            const sessionExists = await this.redisService.zScore(userSessionsKey, decoded.sessionId);

            if (sessionExists === null) {
                return false;
            }

            request.user = decoded;

            return true;
        } catch (error) {
            throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED, {
                cause: error
            });
        }
    }

    private extractCredentialFromHeader(request: any): {
        authToken: string;
    } {
        const authToken = request.headers["authorization"].split(" ")[1] || "";

        return { authToken };
    }
}
