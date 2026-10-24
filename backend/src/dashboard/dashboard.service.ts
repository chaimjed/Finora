import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpendingContext, SpendingService } from '../spending/spending.service';
import { CashflowQueryDto, DashboardQueryDto } from './dto/dashboard-query.dto';
import { BudgetsService } from '../budget/budgets.service';

const DAY_MS = 86_400_000;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spending: SpendingService,
    private readonly budgets: BudgetsService,
  ) {}

  async summary(userId: string, q: DashboardQueryDto) {
    const { from, to, toInclusive } = this.resolveRange(q);
    const ctx = await this.spending.getContext(userId);

    const [balance, totals, spendingByCategory, recent, budgets, upcoming, goals] =
      await Promise.all([
        this.totalBalance(userId, ctx),
        this.spending.totals(userId, from, to, ctx),
        this.categoryBreakdown(userId, from, to, ctx),
        this.recentTransactions(userId, from, to),
        this.budgets.findAll(userId, toInclusive.toISOString().slice(0, 7)), // month of the range end
        this.upcomingRecurring(userId),
        this.goalsProgress(userId),
      ]);

    return {
      currency: ctx.base,
      range: { from: this.day(from), to: this.day(toInclusive) },
      balance,
      cashflow: {
        income: totals.income.toNumber(),
        expense: totals.expense.toNumber(),
        net: totals.income.minus(totals.expense).toNumber(),
      },
      spendingByCategory,
      recentTransactions: recent,
      budgets: {
        month: budgets.month,
        totals: budgets.totals,
        items: [...budgets.items].sort((a, b) => b.percentUsed - a.percentUsed).slice(0, 5),
      },
      upcomingRecurring: upcoming,
      goals,
    };
  }

  async cashflow(userId: string, q: CashflowQueryDto) {
    const { from, to, toInclusive } = this.resolveRange(q);
    const ctx = await this.spending.getContext(userId);
    const days = (to.getTime() - from.getTime()) / DAY_MS;
    const granularity = q.granularity ?? (days <= 62 ? 'day' : 'month');

    return {
      currency: ctx.base,
      granularity,
      range: { from: this.day(from), to: this.day(toInclusive) },
      series: await this.spending.cashflow(userId, from, to, ctx, granularity),
    };
  }

  // ---------------------------------------------------------------------------
  // Widgets
  // ---------------------------------------------------------------------------

  private async totalBalance(userId: string, ctx: SpendingContext) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { id: true, name: true, type: true, currency: true, balance: true },
      orderBy: { createdAt: 'asc' },
    });

    let total = new Prisma.Decimal(0);
    for (const a of accounts) total = total.plus(await ctx.convert(a.balance, a.currency));

    return {
      total: total.toNumber(),
      accounts: accounts.map((a) => ({ ...a, balance: a.balance.toNumber() })),
    };
  }

  /** Expenses rolled up to top-level categories: top 6 + "Other". */
  private async categoryBreakdown(userId: string, from: Date, to: Date, ctx: SpendingContext) {
    const [spent, cats] = await Promise.all([
      this.spending.expenseByCategory(userId, from, to, ctx),
      this.prisma.category.findMany({
        where: { OR: [{ userId }, { userId: null }] },
        select: { id: true, name: true, parentId: true },
      }),
    ]);

    const byId = new Map(cats.map((c) => [c.id, c]));
    const rootOf = (id: string) => {
      let c = byId.get(id);
      while (c?.parentId) c = byId.get(c.parentId);
      return c;
    };

    const roots = new Map<string, { id: string; name: string; amount: Prisma.Decimal }>();
    for (const [id, amount] of spent) {
      const root = rootOf(id);
      if (!root) continue;
      const cur = roots.get(root.id) ?? { id: root.id, name: root.name, amount: new Prisma.Decimal(0) };
      cur.amount = cur.amount.plus(amount);
      roots.set(root.id, cur);
    }

    const sorted = [...roots.values()].sort((a, b) => b.amount.comparedTo(a.amount));
    const total = sorted.reduce((s, r) => s.plus(r.amount), new Prisma.Decimal(0));
    const rest = sorted.slice(6).reduce((s, r) => s.plus(r.amount), new Prisma.Decimal(0));
    const rows = [
      ...sorted.slice(0, 6),
      ...(rest.gt(0) ? [{ id: 'other', name: 'Other', amount: rest }] : []),
    ];

    return rows.map((r) => ({
      categoryId: r.id,
      name: r.name,
      amount: r.amount.toNumber(),
      percent: total.isZero() ? 0 : r.amount.div(total).times(100).toDecimalPlaces(1).toNumber(),
    }));
  }

  private async recentTransactions(userId: string, from: Date, to: Date) {
    const txs = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: from, lt: to } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: {
        category: { select: { id: true, name: true } },
        account: { select: { id: true, name: true, currency: true } },
        relatedAccount: { select: { id: true, name: true, currency: true } },
      },
    });

    return txs.map((t) => ({
      id: t.id,
      type: t.type,
      date: t.date,
      description: t.description,
      amount: t.amount.toNumber(),
      currency: t.account.currency,
      destinationAmount: t.destinationAmount?.toNumber() ?? null,
      category: t.category,
      account: t.account,
      relatedAccount: t.relatedAccount,
    }));
  }

  /** Active recurring items due in the next 30 days. */
  private async upcomingRecurring(userId: string) {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const items = await this.prisma.recurringTransaction.findMany({
  where: {
  userId,
  status: 'ACTIVE',
  nextExecutionDate: { gte: today, lte: new Date(today.getTime() + 30 * DAY_MS) },
},
      orderBy: { nextExecutionDate: 'asc' },
      take: 5,
      include: {
        category: { select: { id: true, name: true } },
        account: { select: { currency: true } },
      },
    });

    return items.map((r) => ({
      id: r.id,
      type: r.type,
      description: r.description,
      amount: r.amount.toNumber(),
      currency: r.account.currency,
      nextExecutionDate: r.nextExecutionDate,
      category: r.category,
    }));
  }

  private async goalsProgress(userId: string) {
    const goals = await this.prisma.financialGoal.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: [{ targetDate: 'asc' }, { createdAt: 'asc' }],
      take: 3,
    });

    return goals.map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount.toNumber(),
      currentAmount: g.currentAmount.toNumber(),
      targetDate: g.targetDate,
      percent: g.targetAmount.isZero()
        ? 0
        : Math.min(g.currentAmount.div(g.targetAmount).times(100).toDecimalPlaces(1).toNumber(), 100),
    }));
  }

  // ---------------------------------------------------------------------------
  // Range helpers
  // ---------------------------------------------------------------------------

  /** Default: whole current month. `to` is inclusive in the API, exclusive internally. */
  private resolveRange(q: DashboardQueryDto) {
    const now = new Date();
    const from = q.from
      ? this.parseDay(q.from)
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const toInclusive = q.to
      ? this.parseDay(q.to)
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

    if (from > toInclusive) throw new BadRequestException('"from" must be before or equal to "to"');
    if ((toInclusive.getTime() - from.getTime()) / DAY_MS > 366) {
      throw new BadRequestException('The date range cannot exceed one year');
    }
    return { from, toInclusive, to: new Date(toInclusive.getTime() + DAY_MS) };
  }

  private parseDay(s: string): Date {
    const d = new Date(`${s}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw new BadRequestException(`Invalid date: ${s}`);
    return d;
  }

  private day(d: Date) {
    return d.toISOString().slice(0, 10);
  }
}