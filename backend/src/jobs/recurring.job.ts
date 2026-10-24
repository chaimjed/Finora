// jobs/recurring.job.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringProcessorService } from '../recurring-transactions/recurring-processor.service';
import { JobRunService } from './job-run.service';

@Injectable()
export class RecurringJob {
  private running = false; // prevents overlap inside this instance (the DB claim protects across instances)

  constructor(
    private readonly processor: RecurringProcessorService,
    private readonly jobRuns: JobRunService,
  ) {}

  // Hourly: if a run fails or the server was down, the next run catches up.
  @Cron(CronExpression.EVERY_HOUR, { name: 'recurring-transactions' })
  async run() {
    if (this.running) return;
    this.running = true;
    try {
      await this.jobRuns.track('recurring-transactions', async () => {
        const r = await this.processor.processDue();
        return {
          processed: r.rulesChecked,
          succeeded: r.created + r.skippedDuplicates,
          failed: r.failed,
          details: r.errors.length ? { errors: r.errors.slice(0, 20) } : undefined,
        };
      });
    } finally {
      this.running = false;
    }
  }
}