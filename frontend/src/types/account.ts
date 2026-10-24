export type { Account, AccountType, AccountStatus } from "../services/accountsService";
import type { AccountType } from "../services/accountsService";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: "Bank",
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
  SAVINGS: "Savings",
  CUSTOM: "Custom",
};

export const ACCOUNT_TYPE_BADGE_COLOR: Record<AccountType, string> = {
  BANK: "info",
  SAVINGS: "success",
  CASH: "gray",
  CREDIT_CARD: "purple",
  CUSTOM: "indigo",
};