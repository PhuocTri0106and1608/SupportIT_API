import { env } from "@environments";
import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/decorators";

@Controller()
export class AppController {
    @Public()
    @Get()
    start() {
        return {
            statusCode: 200,
            data: new Date().toISOString() + " - VERSION: " + env.API_VERSION
        };
    }
}
