import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TransactionType } from '../../generated/prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { CreateTransactionInput } from './transaction.types';

const MAX_AMOUNT = 999_999_999_999.999;

interface BalanceEffect {
  type: TransactionType;
  accountId: string;
  relatedAccountId?: string | null;
  amount: number;
  destinationAmount?: number | null;
}

const INCLUDE_REFS = {
  account: { select: { id: true, name: true, currency: true } },
  relatedAccount: { select: { id: true, name: true, currency: true } },
  category: {
    select: {
      id: true,
      name: true,
      parentId: true,
      parent: { select: { id: true, name: true } },
    },
  },
} as const;

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** REST entry point: opens the DB transaction and delegates to createWithin. */
  async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.$transaction((tx) =>
      this.createWithin(tx, userId, {
        type: dto.type,
        accountId: dto.accountId,
        relatedAccountId: dto.relatedAccountId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        destinationAmount: dto.destinationAmount,
        exchangeRate: dto.exchangeRate,
        date: new Date(dto.date),
        description: dto.description,
        notes: dto.notes,
      }),
    );
  }

  /**
   * Single place where a transaction is created and balances are updated.
   * Uses ONLY `tx`, so the caller (REST or the recurring cron) controls the DB transaction.
   */
  async createWithin(tx: Prisma.TransactionClient, userId: string, input: CreateTransactionInput) {
    const isTransfer = input.type === TransactionType.TRANSFER;
    const amount = Number(input.amount);

    if (isTransfer && input.categoryId) {
      throw new BadRequestException('Transfers cannot have a category');
    }
    if (isTransfer && !input.relatedAccountId) {
      throw new BadRequestException('A transfer needs a destination account');
    }
    if (!isTransfer && input.relatedAccountId) {
      throw new BadRequestException('A destination account is only allowed for transfers');
    }

    const account = await tx.account.findFirst({ where: { id: input.accountId, userId } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot add a transaction to an archived account');
    }

    let relatedAccount: { currency: string } | null = null;
    if (isTransfer) {
      if (input.relatedAccountId === input.accountId) {
        throw new BadRequestException('Source and destination accounts must be different');
      }
      const found = await tx.account.findFirst({ where: { id: input.relatedAccountId!, userId } });
      if (!found) throw new NotFoundException('Destination account not found');
      if (found.status !== 'ACTIVE') {
        throw new BadRequestException('Cannot transfer to an archived account');
      }
      relatedAccount = found;
    }

    if (input.categoryId) {
      await this.assertUsableCategory(tx, userId, input.categoryId, input.type);
    }

    let destinationAmount: number | undefined;
    let exchangeRate: number | undefined;

    if (isTransfer && relatedAccount) {
      if (account.currency === relatedAccount.currency) {
        destinationAmount = amount;
      } else {
        if (input.exchangeRate === undefined && input.destinationAmount === undefined) {
          throw new BadRequestException(
            'exchangeRate or destinationAmount is required for a cross-currency transfer',
          );
        }
        destinationAmount = input.destinationAmount ?? this.convert(amount, input.exchangeRate!);
        exchangeRate = input.exchangeRate ?? this.impliedRate(amount, destinationAmount);
      }
    }

    const transaction = await tx.transaction.create({
      data: {
        userId,
        accountId: input.accountId,
        relatedAccountId: isTransfer ? input.relatedAccountId : undefined,
        categoryId: input.categoryId,
        recurringTransactionId: input.recurringTransactionId ?? undefined,
        type: input.type,
        amount,
        destinationAmount,
        exchangeRate,
        date: input.date,
        description: input.description,
        notes: input.notes,
      },
    });

    await this.applyBalanceEffect(
      tx,
      {
        type: input.type,
        accountId: input.accountId,
        relatedAccountId: input.relatedAccountId,
        amount,
        destinationAmount,
      },
      1,
    );

    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.lockOwned(tx, userId, id);
      const isTransfer = existing.type === TransactionType.TRANSFER;

      if (!isTransfer && (dto.destinationAmount !== undefined || dto.exchangeRate !== undefined)) {
        throw new BadRequestException('Only transfers have a destination amount or an exchange rate');
      }
      if (dto.categoryId) {
        if (isTransfer) throw new BadRequestException('Transfers cannot have a category');
        if (dto.categoryId !== existing.categoryId) {
          await this.assertUsableCategory(tx, userId, dto.categoryId, existing.type);
        }
      }

      const oldAmount = Number(existing.amount);
      const oldDestination =
        existing.destinationAmount !== null ? Number(existing.destinationAmount) : undefined;

      const newAmount = dto.amount ?? oldAmount;
      let newDestination = oldDestination;
      let newRate: number | undefined;

      if (isTransfer) {
        const source = await tx.account.findUniqueOrThrow({ where: { id: existing.accountId } });
        const target = await tx.account.findUniqueOrThrow({ where: { id: existing.relatedAccountId! } });

        if (source.currency === target.currency) {
          newDestination = newAmount;
        } else if (
          dto.amount !== undefined ||
          dto.destinationAmount !== undefined ||
          dto.exchangeRate !== undefined
        ) {
          if (dto.amount !== undefined && dto.destinationAmount === undefined && dto.exchangeRate === undefined) {
            throw new BadRequestException(
              'exchangeRate or destinationAmount is required when changing the amount of a cross-currency transfer',
            );
          }
          if (dto.destinationAmount !== undefined) {
            newDestination = dto.destinationAmount;
            newRate = dto.exchangeRate ?? this.impliedRate(newAmount, newDestination);
          } else {
            newRate = dto.exchangeRate!;
            newDestination = this.convert(newAmount, newRate);
          }
        }
      }

      if (newAmount !== oldAmount || newDestination !== oldDestination) {
        const base = {
          type: existing.type,
          accountId: existing.accountId,
          relatedAccountId: existing.relatedAccountId,
        };
        await this.applyBalanceEffect(tx, { ...base, amount: oldAmount, destinationAmount: oldDestination }, -1);
        await this.applyBalanceEffect(tx, { ...base, amount: newAmount, destinationAmount: newDestination }, 1);
      }

      return tx.transaction.update({
        where: { id },
        data: {
          amount: newAmount,
          destinationAmount: newDestination,
          exchangeRate: newRate,
          date: dto.date ? new Date(dto.date) : undefined,
          description: dto.description,
          notes: dto.notes,
          categoryId: dto.categoryId,
        },
      });
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.lockOwned(tx, userId, id);

      await this.applyBalanceEffect(
        tx,
        {
          type: existing.type,
          accountId: existing.accountId,
          relatedAccountId: existing.relatedAccountId,
          amount: Number(existing.amount),
          destinationAmount:
            existing.destinationAmount !== null ? Number(existing.destinationAmount) : undefined,
        },
        -1,
      );

      await tx.transaction.delete({ where: { id } });
      return { success: true };
    });
  }

  async findAll(userId: string, query: ListTransactionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    let categoryIds: string[] | undefined;
    if (query.categoryId) {
      categoryIds = [query.categoryId];
      if (query.includeSubcategories ?? true) {
        const children = await this.prisma.category.findMany({
          where: {
            parentId: query.categoryId,
            OR: [{ userId: null }, { userId }],
          },
          select: { id: true },
        });
        categoryIds.push(...children.map((c) => c.id));
      }
    }

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(query.accountId && {
        OR: [{ accountId: query.accountId }, { relatedAccountId: query.accountId }],
      }),
      ...(categoryIds && { categoryId: { in: categoryIds } }),
      ...(query.type && { type: query.type }),
      ...(query.search && { description: { contains: query.search } }),
      ...((query.dateFrom || query.dateTo) && {
        date: {
          ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
          ...(query.dateTo && { lte: new Date(`${query.dateTo}T23:59:59.999Z`) }),
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: INCLUDE_REFS,
        orderBy: [
          { date: query.sortOrder ?? 'desc' },
          { createdAt: query.sortOrder ?? 'desc' },
          { id: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: INCLUDE_REFS,
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  private async lockOwned(tx: Prisma.TransactionClient, userId: string, id: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM \`Transaction\` WHERE id = ${id} AND userId = ${userId} FOR UPDATE`;
    if (rows.length === 0) throw new NotFoundException('Transaction not found');

    const existing = await tx.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Transaction not found');
    return existing;
  }

  private async assertUsableCategory(
    tx: Prisma.TransactionClient,
    userId: string,
    categoryId: string,
    type: TransactionType,
  ) {
    const category = await tx.category.findFirst({
      where: { id: categoryId, OR: [{ userId: null }, { userId }] },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category.type !== type) {
      throw new BadRequestException(
        `Category type (${category.type}) does not match transaction type (${type})`,
      );
    }
    if (category.status !== 'ACTIVE') throw new BadRequestException('This category is archived');
  }

  private convert(amount: number, rate: number): number {
    const result = Math.round(amount * rate * 1000) / 1000;
    if (!(result > 0) || result > MAX_AMOUNT) {
      throw new BadRequestException('Converted amount is out of range');
    }
    return result;
  }

  private impliedRate(amount: number, destinationAmount: number): number {
    return Number((destinationAmount / amount).toFixed(8));
  }

  private async applyBalanceEffect(tx: Prisma.TransactionClient, effect: BalanceEffect, direction: 1 | -1) {
    const deltas: { accountId: string; delta: number }[] = [];

    if (effect.type === TransactionType.INCOME) {
      deltas.push({ accountId: effect.accountId, delta: effect.amount });
    } else if (effect.type === TransactionType.EXPENSE) {
      deltas.push({ accountId: effect.accountId, delta: -effect.amount });
    } else {
      deltas.push({ accountId: effect.accountId, delta: -effect.amount });
      deltas.push({ accountId: effect.relatedAccountId!, delta: effect.destinationAmount ?? effect.amount });
    }

    deltas.sort((a, b) => (a.accountId < b.accountId ? -1 : 1));

    for (const { accountId, delta } of deltas) {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: direction * delta } },
      });
    }
  }
}