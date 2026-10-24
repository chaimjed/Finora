import { api } from "../lib/axios";
import type { CashflowResponse, DashboardSummary, RangeParams } from "../types/dashboard";

export const dashboardService = {
  summary: (params: RangeParams) =>
    api.get<DashboardSummary>("/dashboard/summary", { params }).then((r) => r.data),

  cashflow: (params: RangeParams) =>
    api.get<CashflowResponse>("/dashboard/cashflow", { params }).then((r) => r.data),
};