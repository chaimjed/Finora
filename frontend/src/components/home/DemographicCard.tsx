import { Dropdown, DropdownItem } from "flowbite-react";
import { MoreDotIcon } from "../../icons";

interface Category {
  name: string;
  amount: string;
  percent: number;
  color: string;
}

const categories: Category[] = [
  { name: "Food", amount: "$620", percent: 34, color: "bg-brand-500" },
  { name: "Housing", amount: "$500", percent: 27, color: "bg-blue-light-500" },
  { name: "Transport", amount: "$310", percent: 17, color: "bg-warning-500" },
  { name: "Entertainment", amount: "$250", percent: 14, color: "bg-success-500" },
  { name: "Other", amount: "$150", percent: 8, color: "bg-error-500" },
];

export default function DemographicCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Spending by Category
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Breakdown of your expenses this month
          </p>
        </div>

        <div className="relative h-fit">
          <Dropdown
            label=""
            dismissOnClick={true}
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

      <div className="mt-6 space-y-5">
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${cat.color}`} />
              <div>
                <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                  {cat.name}
                </p>
                <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                  {cat.amount}
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-35 items-center gap-3">
              <div className="relative block h-2 w-full max-w-25 rounded-sm bg-gray-200 dark:bg-gray-800">
                <div
                  className={`absolute top-0 left-0 h-full rounded-sm ${cat.color}`}
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
              <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                {cat.percent}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}