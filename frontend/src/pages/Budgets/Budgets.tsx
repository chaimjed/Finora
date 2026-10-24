import { useEffect, useState } from "react";
import { Progress, Button, Badge, Alert, TextInput, Spinner } from "flowbite-react";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineDuplicate } from "react-icons/hi";
import type { BudgetItem, BudgetState } from "../../types/budget";
import BudgetFormModal from "./BudgetFormModal";
import DeleteBudgetModal from "./DeleteBudgetModal";
import { useBudgetsStore } from "../../store/budgetsStore";

const money = (n: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);

const progressColor = (s: BudgetState) =>
  s === "EXCEEDED" ? "red" : s === "WARNING" ? "yellow" : "green";

export default function Budgets() {
  const {
    month, data, categories, loading, error, info,
    setMonth, load, loadCategories, remove, copyPrevious, clearMessages,
  } = useBudgetsStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);

  useEffect(() => {
    load();
    loadCategories();
  }, [load, loadCategories]);

  const currency = data?.currency ?? "TND";
  const items = data?.items ?? [];
  const totals = data?.totals ?? { budget: 0, spent: 0, remaining: 0 };

  return (
    <div className="flex flex-col gap-6">
      {error && <Alert color="failure" onDismiss={clearMessages}>{error}</Alert>}
      {info && <Alert color="success" onDismiss={clearMessages}>{info}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Budgeted</p>
          <p className="mt-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">
            {money(totals.budget, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
          <p className="mt-1 text-title-sm font-semibold text-red-600 dark:text-red-400">
            {money(totals.spent, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
          <p className="mt-1 text-title-sm font-semibold text-green-600 dark:text-green-400">
            {money(totals.remaining, currency)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Budgets</h3>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <TextInput
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              aria-label="Month"
            />
            <Button color="gray" onClick={copyPrevious}>
              <HiOutlineDuplicate className="mr-2 size-5" />
              Copy previous month
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <HiOutlinePlus className="mr-2 size-5" />
              Add Budget
            </Button>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No budgets for this month. Add one, or copy last month's budgets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((b) => (
              <div key={b.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white/90">{b.category.name}</h4>
                    <p className="text-xs text-gray-400">Alert at {b.warningThresholdPercent}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.state === "EXCEEDED" && <Badge color="failure">Over budget</Badge>}
                    {b.state === "WARNING" && <Badge color="warning">Near limit</Badge>}
                    <button
                      onClick={() => { setEditing(b); setFormOpen(true); }}
                      className="text-gray-500 hover:text-brand-500 dark:text-gray-400"
                      aria-label="Edit budget"
                    >
                      <HiOutlinePencil className="size-5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      className="text-gray-500 hover:text-red-500 dark:text-gray-400"
                      aria-label="Delete budget"
                    >
                      <HiOutlineTrash className="size-5" />
                    </button>
                  </div>
                </div>

                <Progress
                  progress={Math.min(100, Math.round(b.percentUsed))}
                  color={progressColor(b.state)}
                  size="md"
                />

                <div className="mt-2 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{money(b.spent, currency)} of {money(b.amount, currency)}</span>
                  <span>{b.percentUsed}%</span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {b.overBy > 0
                    ? `Over by ${money(b.overBy, currency)}`
                    : `${money(b.remaining, currency)} remaining`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BudgetFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        categories={categories}
        usedCategoryIds={items.map((b) => b.category.id)}
        month={month}
      />
      <DeleteBudgetModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
        category={deleteTarget?.category.name}
      />
    </div>
  );
}