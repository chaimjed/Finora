import type { BudgetItem } from "./budget";

export type TxType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface RangeParams {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD, inclusive
}

interface NamedRef { id: string; name: string }
interface AccountRef { id: string; name: string; currency: string }

export interface DashboardSummary {
  currency: string;
  range: RangeParams;
  balance: {
    total: number;
    accounts: { id: string; name: string; type: string; currency: string; balance: number }[];
  };
  cashflow: { income: number; expense: number; net: number };
  spendingByCategory: { categoryId: string; name: string; amount: number; percent: number }[];
  recentTransactions: {
    id: string;
    type: TxType;
    date: string;
    description: string | null;
    amount: number;
    currency: string;
    destinationAmount: number | null;
    category: NamedRef | null;
    account: AccountRef;
    relatedAccount: AccountRef | null;
  }[];
  budgets: {
    month: string;
    totals: { budget: number; spent: number; remaining: number };
    items: BudgetItem[];
  };
  upcomingRecurring: {
    id: string;
    type: TxType;
    description: string | null;
    amount: number;
    currency: string;
    nextExecutionDate: string;
    category: NamedRef | null;
  }[];
  goals: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string | null;
    percent: number;
  }[];
}

export interface CashflowPoint { period: string; income: number; expense: number }

export interface CashflowResponse {
  currency: string;
  granularity: "day" | "month";
  range: RangeParams;
  series: CashflowPoint[];
}