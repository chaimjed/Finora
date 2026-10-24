import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";

export default function Reports() {
  const trendOptions: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: ["#465FFF", "#F97066"],
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0 } },
    dataLabels: { enabled: false },
    grid: { yaxis: { lines: { show: true } } },
    xaxis: {
      categories: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { position: "top", horizontalAlign: "left" },
  };

  const trendSeries = [
    { name: "Income", data: [2500, 2600, 2450, 2800, 2700, 3250] },
    { name: "Expenses", data: [1800, 1950, 2100, 1700, 2000, 1943] },
  ];

  const categoryOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    labels: ["Groceries", "Rent", "Transport", "Entertainment", "Utilities", "Other"],
    colors: ["#465FFF", "#9CB9FF", "#F97066", "#FDB022", "#12B76A", "#98A2B3"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
  };

  const categorySeries = [214.5, 650, 145, 82.99, 45.2, 60];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 lg:col-span-2 dark:border-gray-800 dark:bg-white/3">
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            Income vs Expenses
          </h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Last 6 months</p>
          <Chart options={trendOptions} series={trendSeries} type="area" height={300} />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            Spending by Category
          </h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">This month</p>
          <Chart options={categoryOptions} series={categorySeries} type="donut" height={300} />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Savings Rate
        </h3>
        <Chart
          options={{
            chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
            colors: ["#465FFF"],
            plotOptions: { bar: { borderRadius: 4, columnWidth: "40%" } },
            dataLabels: { enabled: false },
            xaxis: { categories: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
            yaxis: { labels: { formatter: (v) => `${v}%` } },
          }}
          series={[{ name: "Savings Rate", data: [28, 25, 14, 39, 26, 40] }]}
          type="bar"
          height={250}
        />
      </div>
    </div>
  );
}