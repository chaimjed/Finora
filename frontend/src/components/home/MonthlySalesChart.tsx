import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";
import { Dropdown, DropdownItem } from "flowbite-react";
import { MoreDotIcon } from "../../icons";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MonthlySalesChart() {
  const options: ApexOptions = {
    colors: ["#12B76A", "#F04438"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 375,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: months,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickPlacement: "on",
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
    fill: { opacity: 1 },
    states: {
      hover: { filter: { type: "none" } },
      active: { filter: { type: "none" } },
    },
    tooltip: {
      x: { show: false },
      y: { formatter: (val: number) => `$${val}` },
    },
  };

  const series = [
    { name: "Income", data: [1200, 1350, 1100, 1400, 1250, 1500, 1450, 1300, 1600, 1550, 1700, 1650] },
    { name: "Expenses", data: [900, 1050, 950, 1100, 1000, 1200, 1150, 1050, 1300, 1250, 1400, 1350] },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6 dark:border-gray-800 dark:bg-white/3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Income vs Expenses
        </h3>
        <div className="relative h-fit">
          <Dropdown
            label=""
            dismissOnClick={true}
            className="w-40 p-2"
            renderTrigger={() => (
              <button type="button">
                <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
              </button>
            )}
          >
            <DropdownItem>View More</DropdownItem>
            <DropdownItem>Delete</DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <div className="min-w-162.5 ps-2 xl:min-w-full">
          <ReactApexChart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}