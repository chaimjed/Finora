import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/signin" replace state={{ from: location }} />;
  return <Outlet />;
}