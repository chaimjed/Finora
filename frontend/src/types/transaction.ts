export type TransactionType = "income" | "expense";
export type TransactionStatus = "cleared" | "pending";

export interface Transaction {
  id: string;
  date: string;  
  description: string;
  category: string;
  account: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
}

export const CATEGORIES = [
  "Salary",
  "Groceries",
  "Transport",
  "Rent",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Other",
] as const;

export const ACCOUNTS = ["Cash", "Checking", "Savings", "Credit Card"] as const;