import { SliderHorizontalIcon } from "../../icons";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";

interface Transaction {
  id: number;
  description: string;
  category: string;
  date: string;
  amount: string;
  typeKey: "income" | "expense";
}

const tableData: Transaction[] = [
  { id: 1, description: "September Salary", category: "Income", date: "Sep 10, 2026", amount: "+$2,500.00", typeKey: "income" },
  { id: 2, description: "Grocery Shopping", category: "Food", date: "Sep 09, 2026", amount: "-$85.50", typeKey: "expense" },
  { id: 3, description: "Electricity Bill", category: "Housing", date: "Sep 08, 2026", amount: "-$120.00", typeKey: "expense" },
  { id: 4, description: "Freelance Project", category: "Income", date: "Sep 05, 2026", amount: "+$400.00", typeKey: "income" },
  { id: 5, description: "Netflix Subscription", category: "Entertainment", date: "Sep 03, 2026", amount: "-$12.99", typeKey: "expense" },
];

export default function RecentOrders() {
  const getBadgeColor = (type: Transaction["typeKey"]) =>
    type === "income" ? "success" : "failure";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6 dark:border-gray-800 dark:bg-white/3">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Transactions
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200">
            <SliderHorizontalIcon className="size-5" />
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200">
            See All
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHead className="border-y border-gray-100 dark:border-gray-800">
            <TableHeadCell className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
              Description
            </TableHeadCell>
            <TableHeadCell className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
              Category
            </TableHeadCell>
            <TableHeadCell className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
              Date
            </TableHeadCell>
            <TableHeadCell className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
              Amount
            </TableHeadCell>
            <TableHeadCell className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
              Type
            </TableHeadCell>
          </TableHead>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tableData.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="py-3">
                  <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {tx.description}
                  </p>
                </TableCell>

                <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {tx.category}
                </TableCell>

                <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {tx.date}
                </TableCell>

                <TableCell
                  className={`py-3 text-theme-sm font-medium ${
                    tx.typeKey === "income" ? "text-success-600" : "text-error-600"
                  }`}
                >
                  {tx.amount}
                </TableCell>

                <TableCell className="py-3">
                  <Badge size="sm" color={getBadgeColor(tx.typeKey)}>
                    {tx.typeKey === "income" ? "Income" : "Expense"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}