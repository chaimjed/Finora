import { api } from "../lib/axios";

export type CategoryType = "INCOME" | "EXPENSE";
export type CategoryStatus = "ACTIVE" | "ARCHIVED";

export interface Category {
  id: string;
  userId: string | null;
  parentId: string | null;
  name: string;
  type: CategoryType;
  status: CategoryStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const categoriesService = {
  list: (params?: { type?: CategoryType; status?: "ACTIVE" | "ARCHIVED" | "ALL" }) =>
    api.get<Category[]>("/categories", { params }),
  create: (data: { name: string; type?: CategoryType; parentId?: string }) =>
    api.post<Category>("/categories", data),
  update: (id: string, data: { name: string }) =>
    api.patch<Category>(`/categories/${id}`, data),
  archive: (id: string) => api.patch<Category>(`/categories/${id}/archive`),
  restore: (id: string) => api.patch<Category>(`/categories/${id}/restore`),
  remove: (id: string) => api.delete(`/categories/${id}`),
};