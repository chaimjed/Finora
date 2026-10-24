import { Prisma, TransactionType } from '../../generated/prisma/client';

export interface CreateTransactionInput {
  type: TransactionType;
  accountId: string;
  relatedAccountId?: string | null;
  categoryId?: string | null;
  amount: number | Prisma.Decimal;
  destinationAmount?: number;
  exchangeRate?: number;
  date: Date;
  description?: string | null;
  notes?: string | null;
  recurringTransactionId?: string | null;
}