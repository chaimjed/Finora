import { create } from "zustand";
import type {
  BudgetsResponse, CreateBudgetPayload, ExpenseCategory, UpdateBudgetPayload,
} from "../types/budget";
import { budgetsService } from "../services/budgetsService";

export const currentMonth = () => new Date().toISOString().slice(0, 7);

export function apiErrorMessage(err: unknown): string {
  const msg = (err as any)?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  return msg ?? "Something went wrong";
}

interface BudgetsState {
  month: string;
  data: BudgetsResponse | null;
  categories: ExpenseCategory[];
  loading: boolean;
  error: string | null;
  info: string | null;

  setMonth: (month: string) => Promise<void>;
  load: () => Promise<void>;
  loadCategories: () => Promise<void>;
  create: (p: Omit<CreateBudgetPayload, "month">) => Promise<void>;
  update: (id: string, p: UpdateBudgetPayload) => Promise<void>;
  remove: (id: string) => Promise<void>;
  copyPrevious: () => Promise<void>;
  clearMessages: () => void;
}

export const useBudgetsStore = create<BudgetsState>((set, get) => ({
  month: currentMonth(),
  data: null,
  categories: [],
  loading: false,
  error: null,
  info: null,

  setMonth: async (month) => {
    set({ month });
    await get().load();
  },

  load: async () => {
    set({ loading: true, error: null });
    try {
      const data = await budgetsService.list(get().month);
      set({ data, loading: false });
    } catch (e) {
      set({ error: apiErrorMessage(e), loading: false });
    }
  },

  loadCategories: async () => {
    try {
      set({ categories: await budgetsService.expenseCategories() });
    } catch (e) {
      set({ error: apiErrorMessage(e) });
    }
  },

  // create/update/remove throw on failure so the modal can show the server message
  create: async (p) => {
    await budgetsService.create({ ...p, month: get().month });
    await get().load();
  },

  update: async (id, p) => {
    await budgetsService.update(id, p);
    await get().load();
  },

  remove: async (id) => {
    try {
      await budgetsService.remove(id);
      await get().load();
    } catch (e) {
      set({ error: apiErrorMessage(e) });
    }
  },

  copyPrevious: async () => {
    set({ error: null, info: null });
    try {
      const r = await budgetsService.copyPrevious(get().month);
      set({ info: `${r.created} budget(s) copied, ${r.skipped} already existed.` });
      await get().load();
    } catch (e) {
      set({ error: apiErrorMessage(e) });
    }
  },

  clearMessages: () => set({ error: null, info: null }),
}));