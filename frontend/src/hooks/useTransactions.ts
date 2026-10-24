import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  transactionsService,
  type CreateTransactionPayload,
  type UpdateTransactionPayload,
} from "../services/transactionsService";

type ListParams = Parameters<typeof transactionsService.list>[0];

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (params: ListParams) => ["transactions", "list", params] as const,
};

const AFFECTED_KEYS = ["transactions", "accounts", "budgets", "reports", "dashboard"];

export function useInvalidateTransactions() {
  const qc = useQueryClient();
  return () =>
    Promise.all(AFFECTED_KEYS.map((key) => qc.invalidateQueries({ queryKey: [key] })));
}

export function useTransactions(params: ListParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsService.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (data: CreateTransactionPayload) =>
      transactionsService.create(data).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionPayload }) =>
      transactionsService.update(id, data).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (id: string) => transactionsService.remove(id),
    onSuccess: invalidate,
  });
}