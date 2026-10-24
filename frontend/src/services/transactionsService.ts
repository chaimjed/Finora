import { api } from "../lib/axios";

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

interface AccountRef { id: string; name: string; currency: string }
interface CategoryRef {
  id: string;
  name: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  accountId: string;
  relatedAccountId: string | null;
  categoryId: string | null;
  amount: string;
  destinationAmount: string | null;
  exchangeRate: string | null;
  date: string;
  description: string | null;
  notes: string | null;
  account: AccountRef;
  relatedAccount: AccountRef | null;
  category: CategoryRef | null;
  createdAt: string;
}

export interface PaginatedTransactions {
  items: Transaction[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateTransactionPayload {
  type: TransactionType;
  accountId: string;
  relatedAccountId?: string;
  categoryId?: string;
  amount: number;
  destinationAmount?: number;
  exchangeRate?: number;
  date: string;
  description?: string;
  notes?: string;
}

export interface UpdateTransactionPayload {
  amount?: number;
  destinationAmount?: number;
  exchangeRate?: number;
  date?: string;
  description?: string | null;
  notes?: string | null;
  categoryId?: string | null;
}

export const transactionsService = {
  list: (params: {
    page?: number; limit?: number; accountId?: string; categoryId?: string;
    type?: TransactionType; dateFrom?: string; dateTo?: string; search?: string;
  }) => api.get<PaginatedTransactions>("/transactions", { params }),
  create: (data: CreateTransactionPayload) => api.post<Transaction>("/transactions", data),
  update: (id: string, data: UpdateTransactionPayload) =>
    api.patch<Transaction>(`/transactions/${id}`, data),
  remove: (id: string) => api.delete(`/transactions/${id}`),
};