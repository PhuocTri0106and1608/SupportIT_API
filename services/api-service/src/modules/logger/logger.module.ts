import { Module, RequestMethod } from "@nestjs/common";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { logger } from "./logger";

@Module({
    imports: [
        PinoLoggerModule.forRoot({
            pinoHttp: {
                logger: logger,
                autoLogging: true,
                quietReqLogger: true,
                customLogLevel: function (req, res, err) {
                    if (res.statusCode >= 400 || err) {
                        return "error";
                    }
                    if (res.statusCode >= 300) {
                        return "warn";
                    }
                    return "info";
                },
                customSuccessMessage: function (req, res) {
                    return `${req.method} ${req.url} completed with status ${res.statusCode}`;
                },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                customErrorMessage: function (req, res, err) {
                    return `${req.method} ${req.url} failed with status ${res.statusCode}`;
                }
            },
            exclude: [
                { method: RequestMethod.ALL, path: "health" },
                { method: RequestMethod.ALL, path: "favicon.ico" }
            ]
        })
    ],
    controllers: [],
    providers: []
})
export class LoggerModule {}
