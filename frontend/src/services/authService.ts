import { api } from "../lib/axios";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
register: (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth?: string;
}) => api.post<{ id: string; email: string }>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens>("/auth/login", data),
  google: (idToken: string) =>
    api.post<AuthTokens>("/auth/google", { idToken }),
  logout: (refreshToken: string) => api.post("/auth/logout", { refreshToken }),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
  resendVerification: (email: string) =>
    api.post("/auth/resend-verification", { email }),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (data: {
    token: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => api.post("/auth/reset-password", data),
  setPassword: (newPassword: string) =>
    api.post("/auth/set-password", { newPassword }),
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => api.post("/auth/change-password", data),
};
