import { create } from "zustand";

import type {
  AccountOption, CategoryOption, CreateRecurringPayload, RecurringRule,
  RecurringStatus, UpdateRecurringPayload,
} from "../types/recurring";
import { recurringService } from "../services/recurringService";
import { apiErrorMessage } from "./budgetsStore";

interface RecurringState {
  rules: RecurringRule[];
  statusFilter: "" | RecurringStatus;
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
  loading: boolean;
  processing: boolean;
  error: string | null;
  info: string | null;

  load: () => Promise<void>;
  loadRefs: () => Promise<void>;
  setStatusFilter: (s: "" | RecurringStatus) => Promise<void>;
  create: (p: CreateRecurringPayload) => Promise<void>;
  update: (id: string, p: UpdateRecurringPayload) => Promise<void>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  processNow: () => Promise<void>;
  clearMessages: () => void;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  rules: [],
  statusFilter: "",
  accounts: [],
  expenseCategories: [],
  incomeCategories: [],
  loading: false,
  processing: false,
  error: null,
  info: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const f = get().statusFilter;
      const rules = await recurringService.list(f || undefined);
      set({ rules, loading: false });
    } catch (e) {
      set({ error: apiErrorMessage(e), loading: false });
    }
  },

  loadRefs: async () => {
    try {
      const [accounts, expenseCategories, incomeCategories] = await Promise.all([
        recurringService.accounts(),
        recurringService.categories("EXPENSE"),
        recurringService.categories("INCOME"),
      ]);
      set({ accounts, expenseCategories, incomeCategories });
    } catch (e) {
      set({ error: apiErrorMessage(e) });
    }
  },

  setStatusFilter: async (statusFilter) => {
    set({ statusFilter });
    await get().load();
  },

  // create/update throw on failure so the modal can show the server message
  create: async (p) => {
    await recurringService.create(p);
    await get().load();
  },

  update: async (id, p) => {
    await recurringService.update(id, p);
    await get().load();
  },

  pause: async (id) => {
    set({ error: null, info: null });
    try {
      await recurringService.pause(id);
      await get().load();
    } catch (e) {
      set({ error: apiErrorMessage(e) });
    }
  },

  resume: async (id) => {
    set({ error: null, info: null });
    try {
      await recurringService.resume(id);
      await get().load();
    } catch (e) {
      set({ error: apiErrorMessage(e) });
    }
  },

  remove: async (id) => {
    set({ error: null, info: null });
    try {
      await recurringService.remove(id);
      await get().load();
    } catch (e) {
      set({ error: apiErrorMessage(e) });
    }
  },

  processNow: async () => {
    set({ processing: true, error: null, info: null });
    try {
      const r = await recurringService.processDue();
      const parts = [`${r.created} transaction(s) created`];
      if (r.skippedDuplicates) parts.push(`${r.skippedDuplicates} already existed`);
      if (r.failed) parts.push(`${r.failed} failed`);
      set({
        info: r.rulesChecked === 0 ? "Nothing is due right now." : parts.join(", "),
        error: r.failed ? r.errors.map((x) => x.message).join(" · ") : null,
        processing: false,
      });
      await get().load();
    } catch (e) {
      set({ error: apiErrorMessage(e), processing: false });
    }
  },

  clearMessages: () => set({ error: null, info: null }),
}));