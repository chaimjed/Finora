import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service'; 

export interface SpendingContext {
  base: string;                                  
  currencyOf: (accountId: string) => string;     
  convert: (amount: Prisma.Decimal, from: string) => Promise<Prisma.Decimal>;
}

@Injectable()
export class SpendingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rates: ExchangeRateService,
  ) {}

  async getContext(userId: string): Promise<SpendingContext> {
    const [user, accounts] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { Currency: true } }),
      this.prisma.account.findMany({ where: { userId }, select: { id: true, currency: true } }),
    ]);
    const base = user.Currency;
    const currencies = new Map(accounts.map((a) => [a.id, a.currency]));
    const cache = new Map<string, Prisma.Decimal>();

    return {
      base,
      currencyOf: (id) => currencies.get(id) ?? base,
      convert: async (amount, from) => {
        if (from === base) return amount;
        let rate = cache.get(from);
        if (!rate) {
          const result = await this.rates.getRate(from, base);
          rate = new Prisma.Decimal(result.rate); 
          cache.set(from, rate);
        }
        return amount.mul(rate);
      },
    };
  }
  async expenseByCategory(userId: string, from: Date, to: Date, ctx: SpendingContext) {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'accountId'],
      where: {
        userId,
        type: 'EXPENSE',
        categoryId: { not: null },
        date: { gte: from, lt: to },
      },
      _sum: { amount: true },
    });

    const result = new Map<string, Prisma.Decimal>();
    for (const g of grouped) {
      const converted = await ctx.convert(
        g._sum.amount ?? new Prisma.Decimal(0),
        ctx.currencyOf(g.accountId),
      );
      result.set(
        g.categoryId!,
        (result.get(g.categoryId!) ?? new Prisma.Decimal(0)).plus(converted),
      );
    }
    return result;
  }

  async totals(userId: string, from: Date, to: Date, ctx: SpendingContext) {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['type', 'accountId'],
      where: {
        userId,
        type: { in: ['INCOME', 'EXPENSE'] },
        date: { gte: from, lt: to },
      },
      _sum: { amount: true },
    });

    let income = new Prisma.Decimal(0);
    let expense = new Prisma.Decimal(0);
    for (const g of grouped) {
      const v = await ctx.convert(
        g._sum.amount ?? new Prisma.Decimal(0),
        ctx.currencyOf(g.accountId),
      );
      if (g.type === 'INCOME') income = income.plus(v);
      else expense = expense.plus(v);
    }
    return { income, expense };
  }
  async cashflow(
    userId: string,
    from: Date,
    to: Date,
    ctx: SpendingContext,
    granularity: 'day' | 'month',
  ) {
    const txs = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ['INCOME', 'EXPENSE'] },
        date: { gte: from, lt: to },
      },
      select: { type: true, amount: true, date: true, accountId: true },
    });

    const len = granularity === 'day' ? 10 : 7;
    const buckets = new Map<string, { income: Prisma.Decimal; expense: Prisma.Decimal }>();
    const cursor = new Date(from);
    if (granularity === 'month') cursor.setUTCDate(1);
    while (cursor < to) {
      buckets.set(cursor.toISOString().slice(0, len), {
        income: new Prisma.Decimal(0),
        expense: new Prisma.Decimal(0),
      });
      if (granularity === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1);
      else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    for (const t of txs) {
      const b = buckets.get(t.date.toISOString().slice(0, len));
      if (!b) continue;
      const v = await ctx.convert(t.amount, ctx.currencyOf(t.accountId));
      if (t.type === 'INCOME') b.income = b.income.plus(v);
      else b.expense = b.expense.plus(v);
    }

    return [...buckets.entries()].map(([period, v]) => ({
      period,
      income: v.income.toNumber(),
      expense: v.expense.toNumber(),
    }));
  }
}