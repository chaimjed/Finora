import { Module } from "@nestjs/common";
import { RecurringTransactionsModule } from "../recurring-transactions/recurring-transactions.module";
import { JobRunService } from "./job-run.service";
import { RecurringJob } from "./recurring.job";
import { CleanupJob } from "./cleanup.job";

// jobs/jobs.module.ts
@Module({
  imports: [RecurringTransactionsModule],
  providers: [JobRunService, RecurringJob, CleanupJob],
})
export class JobsModule {}