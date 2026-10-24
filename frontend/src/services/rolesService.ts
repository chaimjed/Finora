import { api } from "../lib/axios";

export interface RolePermissionView {
  code: string;
  label: string;
}

export interface RoleView {
  id: string;
  name: string;
  isSystemRole: boolean;
  usersCount: number;
  permissions: RolePermissionView[];
}

export interface PermissionView {
  code: string;
  label: string;
  description: string | null;
}

export const rolesService = {
  list: () => api.get<RoleView[]>("/admin/roles"),
  listPermissions: () => api.get<PermissionView[]>("/admin/roles/permissions"),
  create: (name: string) => api.post<RoleView>("/admin/roles", { name }),
  remove: (id: string) => api.delete(`/admin/roles/${id}`),
  setPermissions: (id: string, permissionCodes: string[]) =>
    api.put<RoleView>(`/admin/roles/${id}/permissions`, { permissionCodes }),
};