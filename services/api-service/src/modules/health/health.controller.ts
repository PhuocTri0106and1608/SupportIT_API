import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { HealthCheck, HealthCheckService, HttpHealthIndicator, MemoryHealthIndicator } from "@nestjs/terminus";
import { Public } from "src/common";

@Controller("health")
@ApiTags("Health")
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly memory: MemoryHealthIndicator,
        private readonly http: HttpHealthIndicator
    ) {}

    @Get()
    @Public()
    @HealthCheck()
    check() {
        return this.health.check([() => this.http.pingCheck("nestjs-docs", "https://docs.nestjs.com")]);
    }

    @Get("heap")
    @HealthCheck()
    checkHeap() {
        return this.health.check([() => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024)]);
    }
}
