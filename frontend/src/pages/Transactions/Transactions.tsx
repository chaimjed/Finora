import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from "flowbite-react";
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash, HiOutlineXMark } from "react-icons/hi2";
import PageMeta from "../../common/PageMeta";
import ConfirmModal from "../../common/ConfirmModal";
import TransactionFormModal from "./TransactionFormModal";
import EditTransactionModal from "./EditTransactionModal";
import { cn } from "../../utils";
import type { Transaction, TransactionType } from "../../services/transactionsService";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useDeleteTransaction,
  useInvalidateTransactions,
  useTransactions,
} from "../../hooks/useTransactions";
import { useAccounts } from "../../hooks/useAccounts";
import { useCategories } from "../../hooks/useCategories";
import CategoryOptions from "../../common/CategoryOptions";

const PAGE_SIZE = 20;

const TYPE_STYLE: Record<TransactionType, { label: string; pill: string; amount: string; sign: string }> = {
  INCOME: {
    label: "Income",
    pill: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
    amount: "text-success-600 dark:text-success-400",
    sign: "+",
  },
  EXPENSE: {
    label: "Expense",
    pill: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
    amount: "text-error-600 dark:text-error-400",
    sign: "-",
  },
  TRANSFER: {
    label: "Transfer",
    pill: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
    amount: "text-gray-700 dark:text-gray-300",
    sign: "",
  },
};

type Filters = {
  search: string;
  accountId: string;
  categoryId: string;
  type: TransactionType | "";
  dateFrom: string;
  dateTo: string;
};

const INITIAL_FILTERS: Filters = {
  search: "",
  accountId: "",
  categoryId: "",
  type: "",
  dateFrom: "",
  dateTo: "",
};

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function renderAmount(tx: Transaction) {
  const style = TYPE_STYLE[tx.type];
  const isCrossCurrency =
    tx.type === "TRANSFER" &&
    !!tx.destinationAmount &&
    !!tx.relatedAccount &&
    tx.relatedAccount.currency !== tx.account.currency;

  return (
    <div className="text-right">
      <span className={cn("font-medium", style.amount)}>
        {style.sign}
        {formatMoney(Number(tx.amount), tx.account.currency)}
      </span>
      {isCrossCurrency && (
        <div className="text-xs text-gray-400">
          → {formatMoney(Number(tx.destinationAmount), tx.relatedAccount!.currency)}
        </div>
      )}
    </div>
  );
}

export default function Transactions() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(filters.search, 400);

  const { data: accounts = [] } = useAccounts("ALL");
  const { data: categories = [] } = useCategories({ status: "ALL" });

  const { data, isPending, isError, isFetching, refetch } = useTransactions({
    page,
    limit: PAGE_SIZE,
    accountId: filters.accountId || undefined,
    categoryId: filters.categoryId || undefined,
    type: filters.type || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    search: debouncedSearch.trim() || undefined,
  });

  const deleteTransaction = useDeleteTransaction();
  const invalidateTransactions = useInvalidateTransactions();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };

  const hasFilters = Object.values(filters).some(Boolean);

  useEffect(() => {
    if (data && data.meta.totalPages > 0 && page > data.meta.totalPages) {
      setPage(data.meta.totalPages);
    }
  }, [data, page]);

  function updateFilters(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteTransaction.isPending) return;
    setActionError(null);
    try {
      await deleteTransaction.mutateAsync(deleteTarget.id);
    } catch {
      setActionError("Could not delete this transaction.");
    } finally {
      setDeleteTarget(null);
    }
  }

  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <>
      <PageMeta title="Transactions | Money Manager" description="View and manage your transactions" />

      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
          {/* En-tête */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Transactions</h3>
            <Button onClick={() => setCreateOpen(true)}>
              <HiOutlinePlus className="mr-2 size-5" />
              New transaction
            </Button>
          </div>

          {/* Filtres */}
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TextInput
              placeholder="Search description..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              aria-label="Search description"
            />
            <Select
              value={filters.accountId}
              onChange={(e) => updateFilters({ accountId: e.target.value })}
              aria-label="Account"
            >
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.status === "ARCHIVED" ? " (archived)" : ""}
                </option>
              ))}
            </Select>
            <Select
              value={filters.categoryId}
              onChange={(e) => updateFilters({ categoryId: e.target.value })}
              aria-label="Category"
            >
              <option value="">All categories</option>
              <CategoryOptions categories={categories} showType />
            </Select>
            <Select
              value={filters.type}
              onChange={(e) => updateFilters({ type: e.target.value as TransactionType | "" })}
              aria-label="Type"
            >
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
            </Select>
            <TextInput
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(e) => updateFilters({ dateFrom: e.target.value })}
              aria-label="From date"
            />
            <TextInput
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(e) => updateFilters({ dateTo: e.target.value })}
              aria-label="To date"
            />
            {hasFilters && (
              <div className="flex items-center">
                <Button color="gray" size="sm" onClick={clearFilters}>
                  <HiOutlineXMark className="mr-1.5 size-4" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>

          {isError && (
            <Alert color="failure" className="mb-4">
              Could not load transactions.{" "}
              <button type="button" onClick={() => refetch()} className="font-medium underline">
                Try again
              </button>
            </Alert>
          )}
          {actionError && (
            <Alert color="failure" className="mb-4" onDismiss={() => setActionError(null)}>
              {actionError}
            </Alert>
          )}

          {/* Tableau */}
          <div
            className={cn(
              "overflow-x-auto rounded-xl border border-gray-200 transition-opacity dark:border-gray-800",
              isFetching && !isPending && "opacity-60",
            )}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Date</TableHeadCell>
                  <TableHeadCell>Description</TableHeadCell>
                  <TableHeadCell>Account</TableHeadCell>
                  <TableHeadCell>Category</TableHeadCell>
                  <TableHeadCell>Type</TableHeadCell>
                  <TableHeadCell className="text-right">Amount</TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isPending && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}

                {!isPending && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-500 dark:text-gray-400">
                      {hasFilters
                        ? "No transactions match your filters."
                        : "No transactions yet. Add your first one to get started."}
                    </TableCell>
                  </TableRow>
                )}

                {items.map((tx) => {
                  const style = TYPE_STYLE[tx.type];
                  return (
                    <TableRow key={tx.id} className="bg-white dark:bg-gray-900">
                      <TableCell className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="max-w-56 truncate" title={tx.description ?? undefined}>
                        {tx.description || <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {tx.account.name}
                        {tx.relatedAccount && <span className="text-gray-400"> → {tx.relatedAccount.name}</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {tx.category ? (
                          tx.category.parent ? (
                            <>
                              <span className="text-gray-400">{tx.category.parent.name} › </span>
                              {tx.category.name}
                            </>
                          ) : (
                            tx.category.name
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", style.pill)}>
                          {style.label}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{renderAmount(tx)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setEditTarget(tx)}
                            className="text-gray-400 transition-colors hover:text-brand-500"
                            aria-label="Edit transaction"
                          >
                            <HiOutlinePencil className="size-5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(tx)}
                            className="text-gray-400 transition-colors hover:text-error-500"
                            aria-label="Delete transaction"
                          >
                            <HiOutlineTrash className="size-5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {from}–{to} of {meta.total}
              </p>
              {meta.totalPages > 1 && (
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                  showIcons
                />
              )}
            </div>
          )}
        </div>
      </div>

      <TransactionFormModal
        show={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          setPage(1);
          invalidateTransactions();
        }}
      />

      <EditTransactionModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => setEditTarget(null)}
      />

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete this transaction?"
        message={
          deleteTarget?.type === "TRANSFER"
            ? "Both account balances will be restored to what they were before this transfer. This cannot be undone."
            : "The account balance will be restored to what it was before this transaction. This cannot be undone."
        }
        details={
          deleteTarget && (
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-500 dark:text-gray-400">
                  {deleteTarget.description || TYPE_STYLE[deleteTarget.type].label}
                </dt>
                <dd className={cn("font-semibold", TYPE_STYLE[deleteTarget.type].amount)}>
                  {TYPE_STYLE[deleteTarget.type].sign}
                  {formatMoney(Number(deleteTarget.amount), deleteTarget.account.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs text-gray-400">
                <span>
                  {deleteTarget.account.name}
                  {deleteTarget.relatedAccount && ` → ${deleteTarget.relatedAccount.name}`}
                </span>
                <span>{formatDate(deleteTarget.date)}</span>
              </div>
            </dl>
          )
        }
        confirmLabel="Delete transaction"
        loading={deleteTransaction.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}