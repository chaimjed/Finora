import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesService } from "../services/categoriesService";

type Params = Parameters<typeof categoriesService.list>[0];
type CreateData = Parameters<typeof categoriesService.create>[0];

export const categoryKeys = {
  all: ["categories"] as const,
  list: (params?: Params) => ["categories", "list", params ?? {}] as const,
};

export function useCategories(params?: Params) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoriesService.list(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

const AFFECTED_KEYS = ["categories", "transactions", "budgets", "recurring", "reports", "dashboard"];

function useInvalidateCategories() {
  const qc = useQueryClient();
  return () => Promise.all(AFFECTED_KEYS.map((key) => qc.invalidateQueries({ queryKey: [key] })));
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (data: CreateData) => categoriesService.create(data).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      categoriesService.update(id, { name }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useArchiveCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => categoriesService.archive(id).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useRestoreCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => categoriesService.restore(id).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => categoriesService.remove(id),
    onSuccess: invalidate,
  });
}