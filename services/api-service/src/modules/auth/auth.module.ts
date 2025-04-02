import { MailerModule } from "@modules/mailer";
import { RedisModule } from "@modules/redis";
import { UserModule } from "@modules/user";
import { Web2AuthModule } from "@modules/web2-auth";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
    imports: [
        JwtModule.register({
            global: true
        }),
        RedisModule,
        UserModule,
        MailerModule,
        Web2AuthModule
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService]
})
export class AuthModule {}
