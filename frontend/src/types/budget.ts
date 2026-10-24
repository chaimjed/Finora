export type BudgetState = "OK" | "WARNING" | "EXCEEDED";

export interface BudgetItem {
  id: string;
  category: { id: string; name: string };
  amount: number;
  spent: number;
  remaining: number;
  overBy: number;
  percentUsed: number;
  warningThresholdPercent: number;
  state: BudgetState;
}

export interface BudgetsResponse {
  month: string; // YYYY-MM
  currency: string;
  totals: { budget: number; spent: number; remaining: number };
  items: BudgetItem[];
}

export interface CreateBudgetPayload {
  categoryId: string;
  amount: number;
  month: string;
  warningThresholdPercent?: number;
}

export interface UpdateBudgetPayload {
  amount?: number;
  warningThresholdPercent?: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  parentId?: string | null;
}