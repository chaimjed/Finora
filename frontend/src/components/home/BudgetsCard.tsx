// components/dashboard/BudgetsCard.tsx
import { Link } from "react-router";
import { Badge, Progress } from "flowbite-react";
import type { DashboardSummary } from "../../types/dashboard";
import Card, { EmptyState } from "./Card";
import { money } from "./format";

export default function BudgetsCard({ summary }: { summary: DashboardSummary | null }) {
  const budgets = summary?.budgets;
  const currency = summary?.currency ?? "TND";
  const color = (s: string) => (s === "EXCEEDED" ? "red" : s === "WARNING" ? "yellow" : "green");

  return (
    <Card
      title="Budget status"
      subtitle={budgets ? `Month ${budgets.month} · most used first` : undefined}
      action={<Link to="/budgets" className="text-sm text-brand-500 hover:underline">Manage</Link>}
    >
      {!budgets || budgets.items.length === 0 ? (
        <EmptyState>No budgets for this month yet.</EmptyState>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {money(budgets.totals.spent, currency)} spent of {money(budgets.totals.budget, currency)} ·{" "}
            {money(budgets.totals.remaining, currency)} left
          </p>
          <div className="flex flex-col gap-4">
            {budgets.items.map((b) => (
              <div key={b.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {b.category.name}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {b.state === "EXCEEDED" && <Badge color="failure">Over</Badge>}
                    {b.state === "WARNING" && <Badge color="warning">Near limit</Badge>}
                    {b.percentUsed}%
                  </span>
                </div>
                <Progress progress={Math.min(100, Math.round(b.percentUsed))} color={color(b.state)} size="sm" />
                <p className="mt-1 text-xs text-gray-400">
                  {money(b.spent, currency)} of {money(b.amount, currency)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}