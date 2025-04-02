import { MESSAGE_CODES } from "@common/constants";
import { env } from "@environments";
import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, TimeoutError, catchError, throwError, timeout } from "rxjs";

@Injectable()
export class RequestTimeoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            timeout(env.API_TIMEOUT), // Correct placement of timeout
            catchError((err) => {
                if (err instanceof TimeoutError) {
                    return throwError(() => new HttpException(MESSAGE_CODES.BAD_REQUEST, HttpStatus.REQUEST_TIMEOUT, { cause: err }));
                }
                return throwError(() => err);
            })
        ); // Ensure all operators are inside pipe()
    }
}
