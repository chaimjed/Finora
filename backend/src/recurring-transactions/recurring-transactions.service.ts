// recurring-transactions/recurring-transactions.service.ts
import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { ListRecurringQueryDto } from './dto/list-recurring-query.dto';
import { addDays, nextOccurrenceAfter, parseDay, toDayString, utcDay } from './recurrence.util';

const include = {
  account: { select: { id: true, name: true, currency: true } },
  relatedAccount: { select: { id: true, name: true, currency: true } },
  category: { select: { id: true, name: true } },
} satisfies Prisma.RecurringTransactionInclude;

type RuleWithRefs = Prisma.RecurringTransactionGetPayload<{ include: typeof include }>;

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRecurringDto) {
    const startDate = this.day(dto.startDate);
    if (startDate < utcDay(new Date())) {
      throw new BadRequestException('The start date cannot be in the past');
    }
    const endDate = dto.endDate ? this.day(dto.endDate) : null;
    if (endDate && endDate < startDate) {
      throw new BadRequestException('The end date must be on or after the start date');
    }

    await this.validateReferences(userId, dto);

    const rule = await this.prisma.recurringTransaction.create({
      data: {
        userId,
        type: dto.type,
        accountId: dto.accountId,
        relatedAccountId: dto.relatedAccountId ?? null,
        categoryId: dto.categoryId ?? null,
        amount: dto.amount,
        frequency: dto.frequency,
        intervalCount: dto.intervalCount ?? 1,
        startDate,
        endDate,
        nextExecutionDate: startDate,
        description: dto.description ?? null,
      },
      include,
    });
    return this.toView(rule);
  }

  async findAll(userId: string, q: ListRecurringQueryDto) {
    const rules = await this.prisma.recurringTransaction.findMany({
      where: { userId, ...(q.status && { status: q.status }) },
      orderBy: [{ status: 'asc' }, { nextExecutionDate: 'asc' }],
      include,
    });
    return rules.map((r) => this.toView(r));
  }

  async findOne(userId: string, id: string) {
    const rule = await this.prisma.recurringTransaction.findFirst({ where: { id, userId }, include });
    if (!rule) throw new NotFoundException('Recurring transaction not found');
    return this.toView(rule);
  }

  async update(userId: string, id: string, dto: UpdateRecurringDto) {
    const rule = await this.findOwnedRaw(userId, id);
    if (rule.status === 'COMPLETED') {
      throw new ConflictException('A completed rule cannot be edited');
    }

    const data: Prisma.RecurringTransactionUncheckedUpdateInput = {};
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.description !== undefined) data.description = dto.description;

    if (dto.categoryId !== undefined) {
      if (dto.categoryId !== null) {
        if (rule.type === 'TRANSFER') throw new BadRequestException('Transfers cannot have a category');
        await this.assertCategory(userId, dto.categoryId, rule.type);
      }
      data.categoryId = dto.categoryId;
    }

    if (dto.endDate !== undefined) {
      if (dto.endDate === null) {
        data.endDate = null;
      } else {
        const endDate = this.day(dto.endDate);
        if (endDate < rule.startDate) {
          throw new BadRequestException('The end date must be on or after the start date');
        }
        data.endDate = endDate;
        // nothing left to run before the new end date
        if (rule.status === 'ACTIVE' && endDate < rule.nextExecutionDate) data.status = 'COMPLETED';
      }
    }

    await this.prisma.recurringTransaction.update({ where: { id }, data });
    return this.findOne(userId, id);
  }

  async pause(userId: string, id: string) {
    const rule = await this.findOwnedRaw(userId, id);
    if (rule.status !== 'ACTIVE') throw new ConflictException('Only an active rule can be paused');
    await this.prisma.recurringTransaction.update({ where: { id }, data: { status: 'PAUSED' } });
    return this.findOne(userId, id);
  }

  /** Occurrences missed while paused are skipped, not back-filled. */
  async resume(userId: string, id: string) {
    const rule = await this.findOwnedRaw(userId, id);
    if (rule.status !== 'PAUSED') throw new ConflictException('Only a paused rule can be resumed');

    const today = utcDay(new Date());
    const next =
      rule.nextExecutionDate >= today
        ? rule.nextExecutionDate
        : nextOccurrenceAfter(rule.startDate, rule.frequency, rule.intervalCount, addDays(today, -1));
    const finished = rule.endDate !== null && next > rule.endDate;

    await this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        status: finished ? 'COMPLETED' : 'ACTIVE',
        nextExecutionDate: next,
        consecutiveFailures: 0,
        lastError: null,
      },
    });
    return this.findOne(userId, id);
  }

  /** Generated transactions are kept (their recurringTransactionId becomes null). */
  async remove(userId: string, id: string) {
    await this.findOwnedRaw(userId, id);
    await this.prisma.recurringTransaction.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------

  private async validateReferences(
    userId: string,
    d: { type: 'INCOME' | 'EXPENSE' | 'TRANSFER'; accountId: string; relatedAccountId?: string; categoryId?: string },
  ) {
    await this.assertActiveAccount(userId, d.accountId);

    if (d.type === 'TRANSFER') {
      if (!d.relatedAccountId) throw new BadRequestException('A transfer needs a destination account');
      if (d.relatedAccountId === d.accountId) {
        throw new BadRequestException('Source and destination accounts must be different');
      }
      if (d.categoryId) throw new BadRequestException('Transfers cannot have a category');
      await this.assertActiveAccount(userId, d.relatedAccountId);
    } else {
      if (d.relatedAccountId) throw new BadRequestException('Only transfers have a destination account');
      if (d.categoryId) await this.assertCategory(userId, d.categoryId, d.type);
    }
  }

  private async assertActiveAccount(userId: string, id: string) {
    const acc = await this.prisma.account.findFirst({
      where: { id, userId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!acc) throw new NotFoundException('Account not found or archived');
  }

  private async assertCategory(userId: string, id: string, type: 'INCOME' | 'EXPENSE') {
    const cat = await this.prisma.category.findFirst({
      where: { id, type, status: 'ACTIVE', OR: [{ userId }, { userId: null }] },
      select: { id: true },
    });
    if (!cat) throw new BadRequestException(`Category not found, archived, or not an ${type.toLowerCase()} category`);
  }

  private async findOwnedRaw(userId: string, id: string) {
    const rule = await this.prisma.recurringTransaction.findFirst({ where: { id, userId } });
    if (!rule) throw new NotFoundException('Recurring transaction not found'); // also covers ownership
    return rule;
  }

  private day(s: string) {
    try { return parseDay(s); } catch { throw new BadRequestException(`Invalid date: ${s}`); }
  }

  private toView(r: RuleWithRefs) {
    return {
      id: r.id,
      type: r.type,
      amount: r.amount.toNumber(),
      currency: r.account.currency,
      frequency: r.frequency,
      intervalCount: r.intervalCount,
      startDate: toDayString(r.startDate),
      endDate: r.endDate ? toDayString(r.endDate) : null,
      nextExecutionDate: toDayString(r.nextExecutionDate),
      lastExecutionDate: r.lastExecutionDate ? toDayString(r.lastExecutionDate) : null,
      status: r.status,
      description: r.description,
      consecutiveFailures: r.consecutiveFailures,
      lastError: r.lastError,
      account: r.account,
      relatedAccount: r.relatedAccount,
      category: r.category,
    };
  }
}