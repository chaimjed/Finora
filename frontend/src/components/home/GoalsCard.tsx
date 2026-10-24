// components/dashboard/GoalsCard.tsx
import { Progress } from "flowbite-react";
import type { DashboardSummary } from "../../types/dashboard";
import Card, { EmptyState } from "./Card";
import { money, shortDate } from "./format";

export default function GoalsCard({ summary }: { summary: DashboardSummary | null }) {
  const goals = summary?.goals ?? [];
  const currency = summary?.currency ?? "TND";

  return (
    <Card title="Savings goals" subtitle="Active goals, nearest target date first">
      {goals.length === 0 ? (
        <EmptyState>No active goals yet.</EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {goals.map((g) => (
            <div key={g.id}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">{g.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{g.percent}%</span>
              </div>
              <Progress progress={Math.round(g.percent)} color="indigo" size="sm" />
              <p className="mt-1 text-xs text-gray-400">
                {money(g.currentAmount, currency)} of {money(g.targetAmount, currency)}
                {g.targetDate ? ` · by ${shortDate(g.targetDate)}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}