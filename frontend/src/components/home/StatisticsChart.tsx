import { useEffect, useRef } from "react";
import Chart from "react-apexcharts";
import { CalenderIcon } from "../../icons";
import ChartTab from "../../common/ChartTab";
import "flatpickr/dist/flatpickr.css";
import type { ApexOptions } from "apexcharts";
import flatpickr from "flatpickr";

export default function StatisticsChart() {
  const datePickerRef = useRef<HTMLInputElement>(null);

  const options: ApexOptions = {
    legend: { show: false, position: "top", horizontalAlign: "left" },
    colors: ["#465FFF", "#F04438"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: { show: false },
    },
    stroke: { curve: "straight", width: [2, 2] },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.55, opacityTo: 0 },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      x: { format: "dd MMM yyyy" },
    },
    xaxis: {
      type: "category",
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "12px", colors: ["#6B7280"] },
      },
      title: { text: "", style: { fontSize: "0px" } },
    },
  };

  const series = [
    { name: "Income", data: [1200, 1350, 1100, 1400, 1250, 1500, 1450, 1300, 1600, 1550, 1700, 1650] },
    { name: "Expenses", data: [900, 1050, 950, 1100, 1000, 1200, 1150, 1050, 1300, 1250, 1400, 1350] },
  ];

  useEffect(() => {
    if (!datePickerRef.current) return;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const fp = flatpickr(datePickerRef.current, {
      mode: "range",
      static: true,
      monthSelectorType: "static",
      dateFormat: "M d",
      defaultDate: [sevenDaysAgo, today],
      clickOpens: true,
      prevArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>',
      nextArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>',
    });

    return () => {
      if (!Array.isArray(fp)) fp.destroy();
    };
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 sm:px-6 sm:pt-6 dark:border-gray-800 dark:bg-white/3">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Financial Overview
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Income and expenses trend
          </p>
        </div>

        <div className="flex items-center gap-3 sm:justify-end">
          <ChartTab />

          <div className="relative inline-flex items-center">
            <CalenderIcon className="pointer-events-none absolute inset-s-1/2 top-1/2 z-10 size-5 -translate-x-1/2 -translate-y-1/2 text-gray-500 lg:inset-s-3 lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2 rtl:translate-x-1/2 rtl:lg:translate-x-0 dark:text-gray-400" />
            <input
              ref={datePickerRef}
              className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200 bg-white text-sm font-medium text-transparent outline-none lg:h-auto lg:w-40 lg:py-2 lg:ps-10 lg:pe-3 lg:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:lg:text-gray-300"
              placeholder="Select date range"
            />
          </div>
        </div>
      </div>

      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <div className="min-w-250 xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}