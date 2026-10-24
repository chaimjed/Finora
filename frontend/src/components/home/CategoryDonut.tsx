// components/dashboard/CategoryDonut.tsx
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { DashboardSummary } from "../../types/dashboard";
import Card, { EmptyState } from "./Card";
import { money } from "./format";
import { useIsDark } from "./useIsDark";

const PALETTE = ["#465fff", "#12b76a", "#f79009", "#f04438", "#7a5af8", "#0ba5ec", "#98a2b3"];

export default function CategoryDonut({ summary }: { summary: DashboardSummary | null }) {
  const dark = useIsDark();
  const items = summary?.spendingByCategory ?? [];
  const currency = summary?.currency ?? "TND";
  const textColor = dark ? "#ffffff" : "#1d2939";

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
      foreColor: dark ? "#98a2b3" : "#667085",
      background: "transparent",
    },
    labels: items.map((i) => i.name),
    colors: PALETTE,
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: { position: "bottom" },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: { color: textColor },
            value: { color: textColor, formatter: (v) => money(Number(v), currency) },
            total: {
              show: true,
              label: "Spent",
              color: textColor,
              formatter: (w) =>
                money(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0), currency),
            },
          },
        },
      },
    },
    tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => money(v, currency) } },
  };

  return (
    <Card title="Spending by category" subtitle="Top 6 categories + Other">
      {items.length === 0 ? (
        <EmptyState>No expenses in this period.</EmptyState>
      ) : (
        <Chart
          key={dark ? "dark" : "light"}
          type="donut"
          height={340}
          options={options}
          series={items.map((i) => i.amount)}
        />
      )}
    </Card>
  );
}