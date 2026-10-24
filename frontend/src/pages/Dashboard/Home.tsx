import { useEffect } from "react";
import { Alert, Spinner } from "flowbite-react";
import PageMeta from "../../common/PageMeta";
import { useDashboardStore } from "../../store/dashboardStore";
import DateRangeFilter from "../../components/home/DateRangeFilter";
import StatsCards from "../../components/home/StatsCards";
import CashflowChart from "../../components/home/CashflowChart";
import CategoryDonut from "../../components/home/CategoryDonut";
import BudgetsCard from "../../components/home/BudgetsCard";
import RecentTransactionsCard from "../../components/home/RecentTransactionsCard";
import UpcomingRecurringCard from "../../components/home/UpcomingRecurringCard";
import GoalsCard from "../../components/home/GoalsCard";

export default function Dashboard() {
  const { summary, cashflow, loading, error, load } = useDashboardStore();

  useEffect(() => {
    load();
  }, [load]);

  const firstLoad = loading && !summary;

  return (
    <>
      <PageMeta title="Dashboard | Money Manager" description="Your balance, spending, budgets and goals at a glance" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Dashboard</h2>
            {summary && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {summary.range.from} → {summary.range.to} · amounts in {summary.currency}
              </p>
            )}
          </div>
          <DateRangeFilter />
        </div>

        {error && <Alert color="failure">{error}</Alert>}

        {firstLoad ? (
          <div className="flex justify-center py-24"><Spinner size="xl" /></div>
        ) : (
          <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
            <StatsCards summary={summary} />

            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12 xl:col-span-8">
                <CashflowChart data={cashflow} />
              </div>
              <div className="col-span-12 xl:col-span-4">
                <CategoryDonut summary={summary} />
              </div>

              <div className="col-span-12 xl:col-span-6">
                <BudgetsCard summary={summary} />
              </div>
              <div className="col-span-12 xl:col-span-6">
                <RecentTransactionsCard summary={summary} />
              </div>

              <div className="col-span-12 xl:col-span-6">
                <UpcomingRecurringCard summary={summary} />
              </div>
              <div className="col-span-12 xl:col-span-6">
                <GoalsCard summary={summary} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}