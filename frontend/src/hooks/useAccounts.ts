import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsService } from "../services/accountsService";

type Status = "ACTIVE" | "ARCHIVED" | "ALL";
type CreateData = Parameters<typeof accountsService.create>[0];
type UpdateData = Parameters<typeof accountsService.update>[1];

export const accountKeys = {
  all: ["accounts"] as const,
  list: (status: Status) => ["accounts", "list", status] as const,
};

export function useAccounts(status: Status = "ALL") {
  return useQuery({
    queryKey: accountKeys.list(status),
    queryFn: () => accountsService.list(status).then((r) => r.data),
    staleTime: 60_000,
  });
}

const AFFECTED_KEYS = ["accounts", "transactions", "dashboard", "reports"];

export function useInvalidateAccounts() {
  const qc = useQueryClient();
  return () => Promise.all(AFFECTED_KEYS.map((key) => qc.invalidateQueries({ queryKey: [key] })));
}

export function useCreateAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (data: CreateData) => accountsService.create(data).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useUpdateAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateData }) =>
      accountsService.update(id, data).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useArchiveAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (id: string) => accountsService.archive(id).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useRestoreAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (id: string) => accountsService.restore(id).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useDeleteAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (id: string) => accountsService.remove(id),
    onSuccess: invalidate,
  });
}