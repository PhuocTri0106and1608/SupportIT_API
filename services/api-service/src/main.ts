import { env } from "@environments";
import { logger } from "@modules/logger";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { setupSwagger } from "./configs/swagger.config";
// import otelSDK from "./instrumentation";

async function bootstrap() {
    // await otelSDK.start();
    // console.log("Started OTEL SDK");

    const app = await NestFactory.create(AppModule);
    app.useLogger(app.get(Logger));
    logger.info("Started using nestjs-pino logger");

    app.use(cookieParser(env.cookie.COOKIE_SECRET));
    logger.info("Set up cookie parser");

    // app.use(helmet());
    // logger.info("Set up helmet");

    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    logger.info("Started validation pipe");

    app.enableShutdownHooks();
    app.enableCors({
        origin: env.corsConfig.ORIGINS.split(","),
        credentials: env.corsConfig.CREDENTIALS ? true : false,
        methods: ["GET", "POST", "DELETE", "PATCH", "PUT"]
    });
    logger.info("Started enabling cors");

    setupSwagger(app);
    logger.info("Started setting up swagger");

    const port = env.PORT || 8080;
    await app.listen(port, "0.0.0.0");
    // console.log(`Server is listening on port ${env.PORT}`);
    logger.info(`${env.SERVICE_NAME} is running on: ${await app.getUrl()}`);
}
bootstrap();
