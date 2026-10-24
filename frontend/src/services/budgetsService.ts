import { api } from "../lib/axios";
import type {
  BudgetItem, BudgetsResponse, CreateBudgetPayload, ExpenseCategory, UpdateBudgetPayload,
} from "../types/budget";

export const budgetsService = {
  list: (month: string) =>
    api.get<BudgetsResponse>("/budgets", { params: { month } }).then((r) => r.data),

  create: (payload: CreateBudgetPayload) =>
    api.post<BudgetItem>("/budgets", payload).then((r) => r.data),

  update: (id: string, payload: UpdateBudgetPayload) =>
    api.patch<BudgetItem>(`/budgets/${id}`, payload).then((r) => r.data),

  remove: (id: string) => api.delete(`/budgets/${id}`),

  copyPrevious: (month: string) =>
    api
      .post<{ month: string; created: number; skipped: number }>("/budgets/copy-previous", { month })
      .then((r) => r.data),

  // ← assumption: replace with the call your Categories page already uses
  expenseCategories: () =>
    api
      .get<ExpenseCategory[]>("/categories", { params: { type: "EXPENSE" } })
      .then((r) => r.data),
};