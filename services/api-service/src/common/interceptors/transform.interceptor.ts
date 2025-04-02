import { CodeResponseEnum } from "@common/enums";
import { logger } from "@modules/logger";
import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";
import { ResponseType } from "../dtos";

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseType<T>> {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<ResponseType<T>> | Promise<Observable<ResponseType<T>>> {
        const response = context.switchToHttp().getResponse();

        if (response.statusCode === HttpStatus.FOUND) {
            // is redirect route
            return next.handle();
        }

        return next.handle().pipe(
            map((data) => {
                const result = {
                    message: data?.message ?? null,
                    code: data?.code,
                    data: data?.data ?? null
                };

                if (result.code && result.code !== CodeResponseEnum.SUCCESS) {
                    logger.error(
                        `Error response: ${JSON.stringify({
                            ...result,
                            context: context.switchToHttp().getRequest().url
                        })}`
                    );
                }

                return result;
            })
        );
    }
}
