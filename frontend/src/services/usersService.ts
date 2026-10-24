import { api } from "../lib/axios";
import type { AuthUser } from "../store/authStore";

export const usersService = {
  getMe: () => api.get<AuthUser>("/users/me"),
  updateMe: (data: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    timezone?: string;
    preferredCurrency?: string;
  }) => api.patch<AuthUser>("/users/me", data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<AuthUser>("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  removeAvatar: () => api.delete<AuthUser>("/users/me/avatar"),
};
