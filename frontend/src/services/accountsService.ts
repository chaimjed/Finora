import { api } from "../lib/axios";

export type AccountType = "BANK" | "CASH" | "CREDIT_CARD" | "SAVINGS" | "CUSTOM";
export type AccountStatus = "ACTIVE" | "ARCHIVED";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: string; 
  notes: string | null;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export const accountsService = {
  list: (status: "ACTIVE" | "ARCHIVED" | "ALL" = "ACTIVE") =>
    api.get<Account[]>("/accounts", { params: { status } }),
  create: (data: { name: string; type: AccountType; currency?: string; initialBalance?: number; notes?: string }) =>
    api.post<Account>("/accounts", data),
  update: (id: string, data: { name?: string; type?: AccountType; notes?: string }) =>
    api.patch<Account>(`/accounts/${id}`, data),
  archive: (id: string) => api.patch<Account>(`/accounts/${id}/archive`),
  restore: (id: string) => api.patch<Account>(`/accounts/${id}/restore`),
  remove: (id: string) => api.delete(`/accounts/${id}`),
};