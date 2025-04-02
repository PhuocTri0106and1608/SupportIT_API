import { MESSAGE_CODES } from "@common/constants";
import { CodeResponseEnum } from "@common/enums";
import { logger } from "@modules/logger";
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly whitelistedUrls: string[] = ["favicon.ico"];
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: any, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const url = request.url;

        const httpStatus = HttpStatus.OK;
        const cause = exception.cause;

        const responseBody = {
            code: CodeResponseEnum.ERROR,
            data: null,
            message: exception?.message || MESSAGE_CODES.INTERNAL_SERVER_ERROR
        };

        if (!this.isUrlWhitelisted(url)) {
            logger.error(`Exception: [Message Error: ${responseBody.message}] - [StackTrace: ${cause?.stack || exception.stack}]`);
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }

    private isUrlWhitelisted(url: string): boolean {
        return this.whitelistedUrls.some((whitelistedUrl) => url.includes(whitelistedUrl));
    }
}
