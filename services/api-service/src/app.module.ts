import { HttpConfigService, MongooseConfigService, ThrottlerConfig } from "@configs";
import { HttpModule } from "@nestjs/axios";
import { Module, ValidationPipe } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
// import { OpenTelemetryModule } from "nestjs-otel";
import { env } from "@environments";
import { BullModule } from "@nestjs/bullmq";
import { AppController } from "./app.controller";
import { AllExceptionsFilter, RequestTimeoutInterceptor, TransformInterceptor } from "./common";
import { AdminModule, AuthModule, BullQueueModule, CVModule, HealthModule, LoggerModule, MailerModule, MediaModule, RedisModule, UserModule, Web2AuthModule, WorkerModule, CandidateModule, InterviewModule, QuizModule, RecruiterModule, LeetCodeModule, JudgeModule } from "./modules";

// const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
//     metrics: {
//         hostMetrics: true,
//         apiMetrics: {
//             enable: true
//         }
//     }
// });

const modules = [LoggerModule, HealthModule, WorkerModule, RedisModule, UserModule, AuthModule, BullQueueModule, MailerModule, Web2AuthModule, AdminModule, MediaModule, CandidateModule, RecruiterModule, CVModule, InterviewModule, QuizModule, JudgeModule, LeetCodeModule];

@Module({
    imports: [
        // OpenTelemetryModuleConfig,
        MongooseModule.forRootAsync({
            useClass: MongooseConfigService
        }),
        HttpModule.registerAsync({
            useClass: HttpConfigService
        }),
        ThrottlerModule.forRootAsync({
            useClass: ThrottlerConfig
        }),
        BullModule.forRoot({
            prefix: env.bull.BULL_PREFIX,
            connection: {
                url: env.bull.REDIS_URL
            },
            defaultJobOptions: {
                delay: 30
            }
        }),
        ...modules
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ValidationPipe
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor
        },
        {
            provide: APP_INTERCEPTOR,
            useFactory: () => {
                return new RequestTimeoutInterceptor();
            }
        },
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter
        }
    ]
})
export class AppModule {}
