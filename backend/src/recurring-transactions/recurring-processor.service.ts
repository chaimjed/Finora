import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { nextOccurrenceAfter, utcDay } from './recurrence.util';

const MAX_RULES_PER_RUN = 500;
const MAX_CATCHUP_PER_RULE = 60;       
const MAX_CONSECUTIVE_FAILURES = 5;   

export interface ProcessResult {
  rulesChecked: number;
  created: number;
  skippedDuplicates: number;
  failed: number;
  errors: { ruleId: string; message: string }[];
}

type Rule = Prisma.RecurringTransactionGetPayload<object>;

@Injectable()
export class RecurringProcessorService {
  private readonly logger = new Logger(RecurringProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionsService,
  ) {}

  async processDue(opts: { userId?: string; now?: Date } = {}): Promise<ProcessResult> {
    const today = utcDay(opts.now ?? new Date());
    const result: ProcessResult = { rulesChecked: 0, created: 0, skippedDuplicates: 0, failed: 0, errors: [] };

    const due = await this.prisma.recurringTransaction.findMany({
      where: {
        status: 'ACTIVE',
        nextExecutionDate: { lte: today },
        ...(opts.userId && { userId: opts.userId }),
      },
      select: { id: true },
      orderBy: { nextExecutionDate: 'asc' },
      take: MAX_RULES_PER_RUN,
    });

    for (const { id } of due) {
      result.rulesChecked++;
      await this.processRule(id, today, result);
    }
    return result;
  }

  private async processRule(id: string, today: Date, result: ProcessResult) {
    for (let i = 0; i < MAX_CATCHUP_PER_RULE; i++) {
      const rule = await this.prisma.recurringTransaction.findUnique({ where: { id } });
      if (!rule || rule.status !== 'ACTIVE' || rule.nextExecutionDate > today) return;

      const due = rule.nextExecutionDate;
      const { next, finished } = this.computeNext(rule, due);

      try {
        const outcome = await this.prisma.$transaction(async (tx) => {
          const claim = await tx.recurringTransaction.updateMany({
            where: { id, status: 'ACTIVE', nextExecutionDate: due },
            data: this.advanceData(due, next, finished),
          });
          if (claim.count === 0) return 'TAKEN' as const;

          await this.transactions.createWithin(tx, rule.userId, {
            type: rule.type,
            accountId: rule.accountId,
            relatedAccountId: rule.relatedAccountId,
            categoryId: rule.categoryId,
            amount: rule.amount,
            date: due,
            description: rule.description,
            recurringTransactionId: rule.id,
          });
          return 'CREATED' as const;
        });

        if (outcome === 'TAKEN') return; // another runner handled it
        result.created++;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          // this occurrence already exists (unique recurringTransactionId + date): just move on
          await this.prisma.recurringTransaction.updateMany({
            where: { id, status: 'ACTIVE', nextExecutionDate: due },
            data: this.advanceData(due, next, finished),
          });
          result.skippedDuplicates++;
          continue;
        }
        await this.recordFailure(rule, e, result);
        return; 
      }
    }
  }

  private computeNext(rule: Rule, due: Date) {
    const next = nextOccurrenceAfter(rule.startDate, rule.frequency, rule.intervalCount, due);
    return { next, finished: rule.endDate !== null && next > rule.endDate };
  }

  private advanceData(due: Date, next: Date, finished: boolean): Prisma.RecurringTransactionUncheckedUpdateManyInput {
    return {
      nextExecutionDate: next,
      lastExecutionDate: due,
      consecutiveFailures: 0,
      lastError: null,
      ...(finished && { status: 'COMPLETED' as const }),
    };
  }

  private async recordFailure(rule: Rule, error: unknown, result: ProcessResult) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);
    const failures = rule.consecutiveFailures + 1;

    await this.prisma.recurringTransaction.update({
      where: { id: rule.id },
      data: {
        consecutiveFailures: failures,
        lastError: message,
        ...(failures >= MAX_CONSECUTIVE_FAILURES && { status: 'PAUSED' as const }),
      },
    });

    result.failed++;
    result.errors.push({ ruleId: rule.id, message });
    this.logger.warn(`Recurring rule ${rule.id} failed (${failures}/${MAX_CONSECUTIVE_FAILURES}): ${message}`);
  }
}