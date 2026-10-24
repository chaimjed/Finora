import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesService } from "../services/rolesService";

export const roleKeys = {
  all: ["roles"] as const,
  permissions: ["permissions"] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.all,
    queryFn: () => rolesService.list().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: roleKeys.permissions,
    queryFn: () => rolesService.listPermissions().then((r) => r.data),
    staleTime: 10 * 60_000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => rolesService.create(name).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useSetRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionCodes }: { id: string; permissionCodes: string[] }) =>
      rolesService.setPermissions(id, permissionCodes).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}