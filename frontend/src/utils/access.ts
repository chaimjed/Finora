import type { AuthUser } from "../store/authStore";

export const ADMIN_PAGES = [
  { path: "/admin/users", permission: "users:read", label: "Users" },
  { path: "/admin/roles", permission: "roles:manage", label: "Roles" },
];

export function hasPermission(user: AuthUser | null, code: string) {
  return !!user?.permissions?.includes(code);
}

export function adminHome(user: AuthUser | null): string | null {
  const page = ADMIN_PAGES.find((p) => hasPermission(user, p.permission));
  return page?.path ?? null;
}