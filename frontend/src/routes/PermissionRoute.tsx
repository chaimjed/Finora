import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../store/authStore";

interface PermissionRouteProps {
  permission?: string;      
  anyOf?: string[];          
}

export default function PermissionRoute({ permission, anyOf }: PermissionRouteProps) {
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);

  const allowed = permission
    ? permissions.includes(permission)
    : anyOf
      ? anyOf.some((p) => permissions.includes(p))
      : false;

  if (!allowed) return <Navigate to="/403" replace />;
  return <Outlet />;
}