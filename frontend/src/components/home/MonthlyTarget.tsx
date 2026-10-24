import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";
import { Dropdown, DropdownItem } from "flowbite-react";
import { ArrowDownIcon, ArrowUpIcon, MoreDotIcon } from "../../icons";

export default function MonthlyTarget() {
  const goal = 1000;
  const saved = 620;
  const progress = Math.round((saved / goal) * 100);

  const series = [progress];
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "80%" },
        track: { background: "#E4E7EC", strokeWidth: "100%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -35,
            color: "#1D2939",
            formatter: (val) => val + "%",
          },
        },
      },
    },
    fill: { type: "solid", colors: ["#465FFF"] },
    stroke: { lineCap: "round" },
    labels: ["Savings"],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3">
      <div className="shadow-default rounded-2xl bg-white px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-11 dark:bg-gray-900">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Savings Goal
            </h3>
            <p className="mt-1 text-theme-sm font-normal text-gray-500 dark:text-gray-400">
              Target set for this month
            </p>
          </div>

          <div className="relative h-fit">
            <Dropdown
              label=""
              dismissOnClick={true}
              className="w-40 p-2"
              renderTrigger={() => (
                <button type="button" className="dropdown-toggle">
                  <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                </button>
              )}
            >
              <DropdownItem>View More</DropdownItem>
              <DropdownItem>Delete</DropdownItem>
            </Dropdown>
          </div>
        </div>

        <div className="relative">
          <div className="max-h-45 overflow-hidden" id="chartDarkStyle">
            <ReactApexChart options={options} series={series} type="radialBar" height={330} />
          </div>

          <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
            +5% vs last month
          </span>
        </div>
        <p className="mx-auto mt-4.5 w-full max-w-95 text-center text-sm text-gray-500 sm:text-base dark:text-gray-400">
          You've saved ${saved} this month, keep it up!
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-theme-xs text-gray-500 sm:text-sm dark:text-gray-400">
            Goal
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 sm:text-lg dark:text-white/90">
            ${goal}
          </p>
        </div>

        <div className="h-7 w-px bg-gray-200 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-theme-xs text-gray-500 sm:text-sm dark:text-gray-400">
            Saved
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 sm:text-lg dark:text-white/90">
            ${saved}
            <ArrowUpIcon className="text-success-600" />
          </p>
        </div>

        <div className="h-7 w-px bg-gray-200 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-theme-xs text-gray-500 sm:text-sm dark:text-gray-400">
            Remaining
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 sm:text-lg dark:text-white/90">
            ${goal - saved}
            <ArrowDownIcon className="text-error-600" />
          </p>
        </div>
      </div>
    </div>
  );
}