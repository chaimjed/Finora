// components/dashboard/StatsCards.tsx
import {
  HiOutlineCash, HiOutlineTrendingDown, HiOutlineTrendingUp, HiOutlineSwitchHorizontal,
} from "react-icons/hi";
import type { DashboardSummary } from "../../types/dashboard";
import { money } from "./format";

export default function StatsCards({ summary }: { summary: DashboardSummary | null }) {
  const c = summary?.currency ?? "TND";
  const cards = [
    {
      label: "Total balance",
      value: summary?.balance.total ?? 0,
      hint: `${summary?.balance.accounts.length ?? 0} active account(s)`,
      icon: HiOutlineCash,
      tone: "text-gray-800 dark:text-white/90",
    },
    {
      label: "Income",
      value: summary?.cashflow.income ?? 0,
      icon: HiOutlineTrendingUp,
      tone: "text-green-600 dark:text-green-400",
    },
    {
      label: "Expenses",
      value: summary?.cashflow.expense ?? 0,
      icon: HiOutlineTrendingDown,
      tone: "text-red-600 dark:text-red-400",
    },
    {
      label: "Net",
      value: summary?.cashflow.net ?? 0,
      hint: "Income − expenses",
      icon: HiOutlineSwitchHorizontal,
      tone:
        (summary?.cashflow.net ?? 0) >= 0
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <Icon className="size-5 text-gray-400" />
          </div>
          <p className={`mt-1 text-title-sm font-semibold ${tone}`}>{money(value, c)}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
      ))}
    </div>
  );
}