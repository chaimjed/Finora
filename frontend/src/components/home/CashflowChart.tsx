// components/dashboard/CashflowChart.tsx
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { CashflowResponse } from "../../types/dashboard";
import Card, { EmptyState } from "./Card";
import { compact, money, periodLabel } from "./format";
import { useIsDark } from "./useIsDark";

export default function CashflowChart({ data }: { data: CashflowResponse | null }) {
  const dark = useIsDark();
  const series = data?.series ?? [];
  const currency = data?.currency ?? "TND";
  const granularity = data?.granularity ?? "day";
  const empty = series.every((p) => p.income === 0 && p.expense === 0);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
      foreColor: dark ? "#98a2b3" : "#667085",
      background: "transparent",
    },
    colors: ["#12b76a", "#f04438"],
    plotOptions: { bar: { columnWidth: series.length > 31 ? "70%" : "45%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: series.map((p) => periodLabel(p.period, granularity)),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { hideOverlappingLabels: true, rotate: 0 },
    },
    yaxis: { labels: { formatter: (v) => compact(v) } },
    grid: {
      borderColor: dark ? "#1d2939" : "#eaecf0",
      xaxis: { lines: { show: false } },
    },
    legend: { position: "top", horizontalAlign: "right" },
    tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => money(v, currency) } },
  };

  return (
    <Card
      title="Income vs expenses"
      subtitle={granularity === "day" ? "Per day" : "Per month"}
    >
      {empty ? (
        <EmptyState>No income or expenses in this period.</EmptyState>
      ) : (
        <Chart
          key={dark ? "dark" : "light"}
          type="bar"
          height={320}
          options={options}
          series={[
            { name: "Income", data: series.map((p) => p.income) },
            { name: "Expenses", data: series.map((p) => p.expense) },
          ]}
        />
      )}
    </Card>
  );
}