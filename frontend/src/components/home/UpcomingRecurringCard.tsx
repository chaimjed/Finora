// components/dashboard/UpcomingRecurringCard.tsx
import { Badge } from "flowbite-react";
import type { DashboardSummary } from "../../types/dashboard";
import Card, { EmptyState } from "./Card";
import { money, shortDate } from "./format";

export default function UpcomingRecurringCard({ summary }: { summary: DashboardSummary | null }) {
  const items = summary?.upcomingRecurring ?? [];

  return (
    <Card title="Upcoming recurring" subtitle="Next 30 days">
      {items.length === 0 ? (
        <EmptyState>Nothing scheduled in the next 30 days.</EmptyState>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                  {r.description || r.category?.name || "Recurring item"}
                </p>
                <p className="text-xs text-gray-400">Due {shortDate(r.nextExecutionDate)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge color={r.type === "INCOME" ? "success" : r.type === "EXPENSE" ? "failure" : "gray"}>
                  {r.type.toLowerCase()}
                </Badge>
                <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {money(r.amount, r.currency)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}