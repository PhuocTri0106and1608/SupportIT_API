import { OAuthProvidersEnum } from "@common/enums";
import { RedisService } from "@modules/redis/redis.service";
import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GoogleModule } from "../google.module";

@Injectable()
export class GoogleOAuth2CandidateGuard extends AuthGuard("google-candidate") {
    constructor(private readonly redisService: RedisService) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const state = request.query.state;

        if (!state) return false; // No state provided

        const storedPreAuthData = await this.redisService.get(`:${GoogleModule.name}:${OAuthProvidersEnum.GOOGLE}:${state}`);

        if (!storedPreAuthData) return false; // Invalid state

        this.redisService.del(`:${GoogleModule.name}:${OAuthProvidersEnum.GOOGLE}:${state}`);

        request.preAuthData = storedPreAuthData;

        return super.canActivate(context) as boolean;
    }
}

@Injectable()
    export class GoogleOAuth2RecruiterGuard extends AuthGuard("google-recruiter") {
    constructor(private readonly redisService: RedisService) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const state = request.query.state;

        if (!state) return false; // No state provided

        const storedPreAuthData = await this.redisService.get(`:${GoogleModule.name}:${OAuthProvidersEnum.GOOGLE}:${state}`);

        if (!storedPreAuthData) return false; // Invalid state

        this.redisService.del(`:${GoogleModule.name}:${OAuthProvidersEnum.GOOGLE}:${state}`);

        request.preAuthData = storedPreAuthData;

        return super.canActivate(context) as boolean;
    }
}

@Injectable()
export class GoogleOAuth2AdminGuard extends AuthGuard("google-admin") {
    constructor(private readonly redisService: RedisService) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const state = request.query.state;

        if (!state) return false; // No state provided

        const storedPreAuthData = await this.redisService.get(`:${GoogleModule.name}:${OAuthProvidersEnum.GOOGLE}:${state}`);

        if (!storedPreAuthData) return false; // Invalid state

        this.redisService.del(`:${GoogleModule.name}:${OAuthProvidersEnum.GOOGLE}:${state}`);

        request.preAuthData = storedPreAuthData;

        return super.canActivate(context) as boolean;
    }
}
