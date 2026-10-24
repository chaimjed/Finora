import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../store/authStore";

export default function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}