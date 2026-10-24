import { api } from "../lib/axios";
import type {
  AccountOption, CategoryOption, CreateRecurringPayload, ProcessDueResult,
  RecurringRule, RecurringStatus, UpdateRecurringPayload,
} from "../types/recurring";

// tolerate both `[...]` and `{ items: [...] }` list responses
const unwrap = <T>(d: T[] | { items: T[] }): T[] => (Array.isArray(d) ? d : d.items);

export const recurringService = {
  list: (status?: RecurringStatus) =>
    api
      .get<RecurringRule[]>("/recurring-transactions", { params: status ? { status } : {} })
      .then((r) => r.data),

  create: (p: CreateRecurringPayload) =>
    api.post<RecurringRule>("/recurring-transactions", p).then((r) => r.data),

  update: (id: string, p: UpdateRecurringPayload) =>
    api.patch<RecurringRule>(`/recurring-transactions/${id}`, p).then((r) => r.data),

  pause: (id: string) =>
    api.patch<RecurringRule>(`/recurring-transactions/${id}/pause`).then((r) => r.data),

  resume: (id: string) =>
    api.patch<RecurringRule>(`/recurring-transactions/${id}/resume`).then((r) => r.data),

  remove: (id: string) => api.delete(`/recurring-transactions/${id}`),

  processDue: () =>
    api.post<ProcessDueResult>("/recurring-transactions/process-due").then((r) => r.data),

  // ← assumptions: reuse the calls your Accounts and Categories pages already make
  accounts: () =>
    api.get<AccountOption[] | { items: AccountOption[] }>("/accounts").then((r) => unwrap(r.data)),

  categories: (type: "INCOME" | "EXPENSE") =>
    api
      .get<CategoryOption[] | { items: CategoryOption[] }>("/categories", { params: { type } })
      .then((r) => unwrap(r.data)),
};