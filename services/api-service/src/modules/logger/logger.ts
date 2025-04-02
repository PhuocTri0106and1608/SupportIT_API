// import { context, trace } from "@opentelemetry/api";
import Pino, { Logger, LoggerOptions } from "pino";

export const loggerOptions: LoggerOptions = {
    level: "trace",
    formatters: {
        level(label) {
            return { level: label.toUpperCase() };
        },
        // Workaround for PinoInstrumentation (does not support latest version yet)
        log(object) {
            // const span = trace.getSpan(context.active());
            // if (!span) return { ...object };
            // const { spanId, traceId } = trace.getSpan(context.active())?.spanContext();
            // return { ...object, spanId, traceId, span_id: spanId, trace_id: traceId };
            return { ...object };
        }
    },
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname,req.headers,res.headers",
            singleLine: true,
            autoLogging: false,
            suppressFlushSyncWarning: true,
            minimumLevel: "trace",
            quietReqLogger: true,
            levelFirst: true
        }
    },
    redact: {
        paths: ["req.headers.authorization", "req.headers.cookie"],
        remove: true
    }
};

export const logger: Logger = Pino(loggerOptions);
