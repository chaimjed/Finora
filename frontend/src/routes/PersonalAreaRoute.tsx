import { Navigate, Outlet } from "react-router";
import { useHasAdminAccess } from "../hooks/useHasAdminAccess";

export default function PersonalAreaRoute() {
  const hasAdminAccess = useHasAdminAccess();
  if (hasAdminAccess) return <Navigate to="/admin" replace />;
  return <Outlet />;
}