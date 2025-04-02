import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { WorkersService } from "./worker.service";

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [WorkersService],
    exports: [WorkersService]
})
export class WorkerModule {}
