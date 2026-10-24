import { useAuthStore } from "../store/authStore";

export function usePermission(code: string): boolean {
  return useAuthStore((s) => s.user?.permissions.includes(code) ?? false);
}