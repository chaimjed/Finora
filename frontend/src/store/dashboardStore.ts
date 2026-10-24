import { create } from "zustand";
import type { CashflowResponse, DashboardSummary, RangeParams } from "../types/dashboard";
import { dashboardService } from "../services/dashboardService";
import { apiErrorMessage } from "./budgetsStore";

export type Preset = "thisMonth" | "lastMonth" | "last3Months" | "thisYear" | "custom";

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function presetRange(p: Exclude<Preset, "custom">): RangeParams {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (p) {
    case "thisMonth":   return { from: fmt(new Date(y, m, 1)),     to: fmt(new Date(y, m + 1, 0)) };
    case "lastMonth":   return { from: fmt(new Date(y, m - 1, 1)), to: fmt(new Date(y, m, 0)) };
    case "last3Months": return { from: fmt(new Date(y, m - 2, 1)), to: fmt(new Date(y, m + 1, 0)) };
    case "thisYear":    return { from: fmt(new Date(y, 0, 1)),     to: fmt(new Date(y, 11, 31)) };
  }
}

interface DashboardState {
  preset: Preset;
  range: RangeParams;
  summary: DashboardSummary | null;
  cashflow: CashflowResponse | null;
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  setPreset: (p: Exclude<Preset, "custom">) => Promise<void>;
  chooseCustom: () => void;
  setCustomRange: (from: string, to: string) => Promise<void>;
}

let requestId = 0;

export const useDashboardStore = create<DashboardState>((set, get) => ({
  preset: "thisMonth",
  range: presetRange("thisMonth"),
  summary: null,
  cashflow: null,
  loading: false,
  error: null,

  load: async () => {
    const id = ++requestId;
    set({ loading: true, error: null });
    try {
      const { range } = get();
      const [summary, cashflow] = await Promise.all([
        dashboardService.summary(range),
        dashboardService.cashflow(range),
      ]);
      if (id !== requestId) return; // a newer request is in flight
      set({ summary, cashflow, loading: false });
    } catch (e) {
      if (id !== requestId) return;
      set({ error: apiErrorMessage(e), loading: false });
    }
  },

  setPreset: async (p) => {
    set({ preset: p, range: presetRange(p) });
    await get().load();
  },

  chooseCustom: () => set({ preset: "custom" }),

  setCustomRange: async (from, to) => {
    if (!from || !to) return set({ error: "Choose both dates" });
    if (from > to) return set({ error: "The start date must be before the end date" });
    const days = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
    if (days > 366) return set({ error: "The range cannot exceed one year" });
    set({ preset: "custom", range: { from, to } });
    await get().load();
  },
}));