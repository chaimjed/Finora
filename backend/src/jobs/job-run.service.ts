// jobs/job-run.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface JobOutcome {
  processed: number;
  succeeded: number;
  failed: number;
  details?: Prisma.InputJsonValue;
}

@Injectable()
export class JobRunService {
  private readonly logger = new Logger(JobRunService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Runs a job body and records the outcome. Idle runs (nothing processed) are not stored. */
  async track(jobName: string, fn: () => Promise<JobOutcome>) {
    const startedAt = new Date();
    try {
      const o = await fn();
      if (o.processed === 0 && o.failed === 0) return;

      await this.prisma.jobRun.create({
        data: {
          jobName, startedAt, finishedAt: new Date(),
          status: o.failed === 0 ? 'SUCCESS' : o.succeeded > 0 ? 'PARTIAL' : 'FAILED',
          processed: o.processed, succeeded: o.succeeded, failed: o.failed,
          details: o.details,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`${jobName} crashed: ${message}`, e instanceof Error ? e.stack : undefined);
      await this.prisma.jobRun
        .create({
          data: { jobName, startedAt, finishedAt: new Date(), status: 'FAILED', error: message.slice(0, 2000) },
        })
        .catch(() => undefined);
    }
  }
}