import { api } from "../lib/axios";

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  profileAvatar: string | null;
  isEmailVerified: boolean;
  role: string;
  hasPassword: boolean;
  googleLinked: boolean;
  createdAt: string;
}

export interface PaginatedUsers {
  items: AdminUserListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  googleUsers: number;
  passwordUsers: number;
  usersByRole: { role: string; count: number }[];
  recentUsers: AdminUserListItem[];
}
export const adminUsersService = {
  list: (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: "all" | "verified" | "unverified";
    provider?: "all" | "google" | "password";
    sortBy?: "createdAt" | "firstName" | "lastName" | "email";
    sortOrder?: "asc" | "desc";
  }) => api.get<PaginatedUsers>("/admin/users", { params }),
  create: (data: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  password: string;
  role?: string;
}) => api.post<AdminUserListItem>("/admin/users", data),
 update: (id: string, data: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  password?: string;
  sendVerificationEmail?: boolean;
}) => api.patch<AdminUserListItem>(`/admin/users/${id}`, data),
  changeRole: (id: string, role: string) =>
    api.patch<AdminUserListItem>(`/admin/users/${id}/role`, { role }),
  remove: (id: string) => api.delete(`/admin/users/${id}`),
  exportCsv: () => api.get("/admin/users/export", { responseType: "blob" }),
  getStats: () => api.get<AdminStats>("/admin/stats"),
};
