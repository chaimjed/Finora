// jobs/cleanup.job.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { JobRunService } from './job-run.service';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

@Injectable()
export class CleanupJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobRuns: JobRunService,
  ) {}

  @Cron('0 3 * * *', { name: 'cleanup' }) // daily at 03:00 (server time)
  async run() {
    await this.jobRuns.track('cleanup', async () => {
      const [tokens, runs] = await Promise.all([
        this.prisma.userToken.deleteMany({ where: { expiresAt: { lt: daysAgo(7) } } }),
        this.prisma.jobRun.deleteMany({ where: { finishedAt: { lt: daysAgo(30) } } }),
      ]);
      const total = tokens.count + runs.count;
      return { processed: total, succeeded: total, failed: 0, details: { tokens: tokens.count, jobRuns: runs.count } };
    });
  }
}