import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { AdminController } from "./admin.controller";
import { AdminRepository } from "./repositories";
import { Admin, AdminLog, AdminLogSchema, AdminSchema } from "./schemas";
import { AdminLogService, AdminService } from "./services";
import { JwtAccessTokenStrategy } from "./strategies";
import { LocalStrategy } from "./strategies/local.strategy";

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            global: true
        }),
        MongooseModule.forFeature([
            { name: Admin.name, schema: AdminSchema },
            { name: AdminLog.name, schema: AdminLogSchema }
        ])
    ],
    controllers: [AdminController],
    providers: [AdminService, AdminRepository, LocalStrategy, JwtAccessTokenStrategy, AdminLogService],
    exports: [AdminService, JwtAccessTokenStrategy, AdminLogService]
})
export class AdminModule {}
