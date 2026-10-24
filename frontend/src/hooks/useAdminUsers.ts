import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUsersService } from "../services/adminService";
import { rolesService } from "../services/rolesService";
import { roleKeys } from "./useAdminRoles";

type ListParams = Parameters<typeof adminUsersService.list>[0];
type CreateData = Parameters<typeof adminUsersService.create>[0];
type UpdateData = Parameters<typeof adminUsersService.update>[1];

export const adminKeys = {
  users: ["admin", "users"] as const,
  usersList: (params: ListParams) => ["admin", "users", "list", params] as const,
  stats: ["admin", "stats"] as const,
};

export function useAdminUsers(params: ListParams) {
  return useQuery({
    queryKey: adminKeys.usersList(params),
    queryFn: () => adminUsersService.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: () => adminUsersService.getStats().then((r) => r.data),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesService.list().then((r) => r.data),
    staleTime: 5 * 60_000, 
  });
}

function useInvalidateAdmin() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: adminKeys.users }),
      qc.invalidateQueries({ queryKey: adminKeys.stats }),
      qc.invalidateQueries({ queryKey: roleKeys.all }),
    ]);
}

export function useCreateUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (data: CreateData) => adminUsersService.create(data).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateData }) =>
      adminUsersService.update(id, data).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useChangeUserRole() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminUsersService.changeRole(id, role).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: string) => adminUsersService.remove(id),
    onSuccess: invalidate,
  });
}

export function useExportUsersCsv() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await adminUsersService.exportCsv();
      const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users.csv";
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}