import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAccountDto) {
    let currency = dto.currency;
    if (!currency) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { Currency: true },
      });
      currency = user?.Currency ?? 'TND';
    }

    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        currency,
        balance: dto.initialBalance ?? 0,
        notes: dto.notes,
      },
    });
  }

  findAll(userId: string, status: 'ACTIVE' | 'ARCHIVED' | 'ALL') {
    return this.prisma.account.findMany({
      where: { userId, ...(status !== 'ALL' && { status }) },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(userId: string, id: string) {
    return this.getOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.getOwned(userId, id);
    return this.prisma.account.update({
      where: { id },
      data: { name: dto.name, type: dto.type, notes: dto.notes },
    });
  }

  async archive(userId: string, id: string) {
    await this.getOwned(userId, id);
    return this.prisma.account.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  async restore(userId: string, id: string) {
    await this.getOwned(userId, id);
    return this.prisma.account.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async remove(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
      select: {
        _count: {
          select: {
            transactionsAsSource: true,
            transactionsAsDestination: true,
            recurringAsSource: true,
            recurringAsDestination: true,
          },
        },
      },
    });
    if (!account) throw new NotFoundException('Account not found');

    const inUse = Object.values(account._count).some((n) => n > 0);
    if (inUse) {
      throw new ConflictException(
        'This account has transactions or recurring transactions — archive it instead',
      );
    }

try {
  await this.prisma.account.delete({ where: { id } });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
    throw new ConflictException('This account has transactions or recurring transactions — archive it instead');
  }
  throw e;
}    return { success: true };
  }

  private async getOwned(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({ where: { id, userId } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }
}