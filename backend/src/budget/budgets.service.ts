// budgets/budgets.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpendingService } from '../spending/spending.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

export type BudgetState = 'OK' | 'WARNING' | 'EXCEEDED';

export function computeBudgetState(
  percentUsed: number,
  threshold: number,
): BudgetState {
  if (percentUsed >= 100) return 'EXCEEDED';
  if (percentUsed >= threshold) return 'WARNING';
  return 'OK';
}

type BudgetWithCategory = Prisma.BudgetGetPayload<{
  include: { category: { select: { id: true; name: true } } };
}>;

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spending: SpendingService,
  ) {}

  async create(userId: string, dto: CreateBudgetDto) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        type: 'EXPENSE',
        status: 'ACTIVE',
        OR: [{ userId }, { userId: null }],
      },
    });
    if (!category) throw new NotFoundException('Expense category not found');

    try {
      const budget = await this.prisma.budget.create({
        data: {
          userId,
          categoryId: dto.categoryId,
          amount: dto.amount,
          periodStart: this.periodStart(dto.month),
          ...(dto.warningThresholdPercent !== undefined && {
            warningThresholdPercent: dto.warningThresholdPercent,
          }),
        },
      });
      return this.findOne(userId, budget.id);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'A budget already exists for this category and month',
        );
      }
      throw e;
    }
  }

  async findAll(userId: string, month?: string) {
    const start = this.periodStart(month);

    const budgets = await this.prisma.budget.findMany({
      where: { userId, periodStart: start },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const { currency, items } = await this.buildStatus(userId, start, budgets);

    const totalBudget = items.reduce((s, i) => s + i.amount, 0);
    const totalSpent = items.reduce((s, i) => s + i.spent, 0);

    return {
      month: start.toISOString().slice(0, 7),
      currency,
      totals: {
        budget: totalBudget,
        spent: totalSpent,
        remaining: Math.max(totalBudget - totalSpent, 0),
      },
      items,
    };
  }

  async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    const { currency, items } = await this.buildStatus(
      userId,
      budget.periodStart,
      [budget],
    );

    return {
      month: budget.periodStart.toISOString().slice(0, 7),
      currency,
      ...items[0],
    };
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    await this.assertOwned(userId, id);
    await this.prisma.budget.update({ where: { id }, data: dto });
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.assertOwned(userId, id);
    await this.prisma.budget.delete({ where: { id } });
  }

  async copyFromPrevious(userId: string, month: string) {
    const target = this.periodStart(month);
    const prev = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() - 1, 1),
    );

    const source = await this.prisma.budget.findMany({
      where: { userId, periodStart: prev, category: { status: 'ACTIVE' } },
    });
    if (!source.length) {
      throw new BadRequestException('No budgets found in the previous month');
    }

    const res = await this.prisma.budget.createMany({
      data: source.map((b) => ({
        userId,
        categoryId: b.categoryId,
        amount: b.amount,
        warningThresholdPercent: b.warningThresholdPercent,
        periodStart: target,
      })),
      skipDuplicates: true,
    });

    return { month, created: res.count, skipped: source.length - res.count };
  }

  private async buildStatus(
    userId: string,
    start: Date,
    budgets: BudgetWithCategory[],
  ) {
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    );

    const [ctx, allCategories] = await Promise.all([
      this.spending.getContext(userId),
      this.prisma.category.findMany({
        where: { OR: [{ userId }, { userId: null }] },
        select: { id: true, parentId: true },
      }),
    ]);
    const currency = ctx.base;

    const spentByCategory = budgets.length
      ? await this.spending.expenseByCategory(userId, start, end, ctx)
      : new Map<string, Prisma.Decimal>();

    const descendants = this.buildDescendantsMap(allCategories);

    const items = budgets.map((b) => {
      const ids = [b.categoryId, ...(descendants.get(b.categoryId) ?? [])];
      const spent = ids.reduce(
        (s, id) => s.plus(spentByCategory.get(id) ?? 0),
        new Prisma.Decimal(0),
      );
      const amount = new Prisma.Decimal(b.amount);
      const percentUsed = amount.isZero()
        ? 0
        : spent.div(amount).times(100).toDecimalPlaces(1).toNumber();

      return {
        id: b.id,
        category: b.category,
        amount: amount.toNumber(),
        spent: spent.toNumber(),
        remaining: Prisma.Decimal.max(amount.minus(spent), 0).toNumber(),
        overBy: Prisma.Decimal.max(spent.minus(amount), 0).toNumber(),
        percentUsed,
        warningThresholdPercent: b.warningThresholdPercent,
        state: computeBudgetState(percentUsed, b.warningThresholdPercent),
      };
    });

    return { currency, items };
  }

  private buildDescendantsMap(
    cats: { id: string; parentId: string | null }[],
  ) {
    const children = new Map<string, string[]>();
    for (const c of cats) {
      if (c.parentId) {
        children.set(c.parentId, [...(children.get(c.parentId) ?? []), c.id]);
      }
    }
    const collect = (id: string): string[] =>
      (children.get(id) ?? []).flatMap((c) => [c, ...collect(c)]);

    return new Map(cats.map((c) => [c.id, collect(c.id)]));
  }

  private periodStart(month?: string): Date {
    if (!month) {
      const n = new Date();
      return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
    }
    const [y, m] = month.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, 1));
  }

  private async assertOwned(userId: string, id: string) {
    const b = await this.prisma.budget.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!b) throw new NotFoundException('Budget not found');
  }
}