import type { TxType } from "./dashboard";

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type RecurringStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

interface AccountRef { id: string; name: string; currency: string }

export interface RecurringRule {
  id: string;
  type: TxType;
  amount: number;
  currency: string;
  frequency: Frequency;
  intervalCount: number;
  startDate: string;          // YYYY-MM-DD
  endDate: string | null;
  nextExecutionDate: string;
  lastExecutionDate: string | null;
  status: RecurringStatus;
  description: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  account: AccountRef;
  relatedAccount: AccountRef | null;
  category: { id: string; name: string } | null;
}

export interface CreateRecurringPayload {
  type: TxType;
  accountId: string;
  relatedAccountId?: string;
  categoryId?: string;
  amount: number;
  frequency: Frequency;
  intervalCount: number;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface UpdateRecurringPayload {
  amount?: number;
  description?: string;
  categoryId?: string | null;
  endDate?: string | null;
}

export interface ProcessDueResult {
  rulesChecked: number;
  created: number;
  skippedDuplicates: number;
  failed: number;
  errors: { ruleId: string; message: string }[];
}

export interface AccountOption { id: string; name: string; currency: string }
export interface CategoryOption { id: string; name: string }