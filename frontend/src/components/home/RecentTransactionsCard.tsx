// components/dashboard/RecentTransactionsCard.tsx
import { Link } from "react-router";
import type { DashboardSummary } from "../../types/dashboard";
import Card, { EmptyState } from "./Card";
import { money, shortDate } from "./format";

export default function RecentTransactionsCard({ summary }: { summary: DashboardSummary | null }) {
  const items = summary?.recentTransactions ?? [];

  return (
    <Card
      title="Recent transactions"
      subtitle="Latest in the selected period"
      action={<Link to="/transactions" className="text-sm text-brand-500 hover:underline">View all</Link>}
    >
      {items.length === 0 ? (
        <EmptyState>No transactions in this period.</EmptyState>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((t) => {
            const sign = t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "−" : "";
            const tone =
              t.type === "INCOME"
                ? "text-green-600 dark:text-green-400"
                : t.type === "EXPENSE"
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-300";
            const title = t.description || t.category?.name || (t.type === "TRANSFER" ? "Transfer" : "Transaction");
            const sub =
              t.type === "TRANSFER" && t.relatedAccount
                ? `${t.account.name} → ${t.relatedAccount.name}`
                : [t.category?.name, t.account.name].filter(Boolean).join(" · ");

            return (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{title}</p>
                  <p className="truncate text-xs text-gray-400">{shortDate(t.date)} · {sub}</p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${tone}`}>
                  {sign}{money(t.amount, t.currency)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}