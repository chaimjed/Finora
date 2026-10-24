import { usePermission } from "./usePermission";

export function useHasAdminAccess(): boolean {
  const canReadUsers = usePermission("users:read");
  const canManageRoles = usePermission("roles:manage");
  const canReadAuditLogs = usePermission("audit:read");
  return canReadUsers || canManageRoles || canReadAuditLogs;
}