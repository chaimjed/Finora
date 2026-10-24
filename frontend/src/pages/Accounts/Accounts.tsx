import { useMemo, useState } from "react";
import { Badge, Button, Alert } from "flowbite-react";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCreditCard,
  HiOutlineArchive,
  HiOutlineRefresh,
  HiOutlineCash,
} from "react-icons/hi";
import { WalletIcon } from "../../icons/WalletIcon";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_BADGE_COLOR,
} from "../../types/account";
import type { Account } from "../../types/account";
import {
  useAccounts,
  useArchiveAccount,
  useRestoreAccount,
} from "../../hooks/useAccounts";
import AccountFormModal from "./AccountFormModal";
import DeleteAccountModal from "./DeleteAccountModal";

type StatusFilter = "ACTIVE" | "ARCHIVED" | "ALL";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "ALL", label: "All" },
];

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

const ICON_BUTTON =
  "rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-white/5";

export default function Accounts() {
  const [status, setStatus] = useState<StatusFilter>("ACTIVE");
  const [actionError, setActionError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const { data, isPending, isError, refetch } = useAccounts("ALL");
  const archiveAccount = useArchiveAccount();
  const restoreAccount = useRestoreAccount();
  const busy = archiveAccount.isPending || restoreAccount.isPending;

  const accounts = useMemo(
    () => (data ?? []).filter((a) => status === "ALL" || a.status === status),
    [data, status],
  );

  const counts = useMemo(() => {
    const all = data ?? [];
    return {
      ACTIVE: all.filter((a) => a.status === "ACTIVE").length,
      ARCHIVED: all.filter((a) => a.status === "ARCHIVED").length,
      ALL: all.length,
    } satisfies Record<StatusFilter, number>;
  }, [data]);

  // Total balance per currency, active accounts only.
  const totalsByCurrency = useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>();
    for (const a of data ?? []) {
      if (a.status !== "ACTIVE") continue;
      const entry = totals.get(a.currency) ?? { total: 0, count: 0 };
      entry.total += Number(a.balance);
      entry.count += 1;
      totals.set(a.currency, entry);
    }
    return Array.from(totals.entries());
  }, [data]);

  async function handleArchive(account: Account) {
    setActionError(null);
    try {
      await archiveAccount.mutateAsync(account.id);
    } catch {
      setActionError("Could not archive this account.");
    }
  }

  async function handleRestore(account: Account) {
    setActionError(null);
    try {
      await restoreAccount.mutateAsync(account.id);
    } catch {
      setActionError("Could not restore this account.");
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Total balance */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isPending &&
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/3"
            />
          ))}

        {!isPending && totalsByCurrency.length === 0 && (
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/5">
              <HiOutlineCash className="size-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total balance</p>
              <p className="mt-0.5 text-title-sm font-semibold text-gray-800 dark:text-white/90">—</p>
            </div>
          </div>
        )}

        {totalsByCurrency.map(([currency, { total, count }]) => (
          <div
            key={currency}
            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-brand-50 dark:bg-brand-500/10" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total balance
                </p>
                <p
                  className={`mt-1 truncate text-title-sm font-semibold ${
                    total >= 0
                      ? "text-gray-800 dark:text-white/90"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatMoney(total, currency)}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  {count} active {count === 1 ? "account" : "accounts"}
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                {currency}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Accounts list */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Accounts
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Manage the places where your money lives.
            </p>
          </div>
          <Button onClick={openCreate}>
            <HiOutlinePlus className="mr-2 size-5" />
            Add Account
          </Button>
        </div>

        <div
          className="mb-5 inline-flex rounded-lg bg-gray-100 p-1 dark:bg-white/5"
          role="tablist"
          aria-label="Account status"
        >
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={status === t.value}
              onClick={() => setStatus(t.value)}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === t.value
                  ? "bg-white text-gray-800 shadow-sm dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  status === t.value
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "bg-gray-200/70 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                }`}
              >
                {counts[t.value]}
              </span>
            </button>
          ))}
        </div>

        {isError && (
          <Alert color="failure" className="mb-4">
            Could not load accounts.{" "}
            <button
              type="button"
              onClick={() => refetch()}
              className="font-medium underline"
            >
              Try again
            </button>
          </Alert>
        )}
        {actionError && (
          <Alert
            color="failure"
            className="mb-4"
            onDismiss={() => setActionError(null)}
          >
            {actionError}
          </Alert>
        )}

        {isPending && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/3"
              />
            ))}
          </div>
        )}

        {!isPending && !isError && accounts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 py-14 text-center dark:border-gray-800">
            <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5">
              <WalletIcon className="size-6" />
            </div>
            <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
              {status === "ARCHIVED"
                ? "No archived accounts."
                : "No accounts yet. Add your first one to start tracking balances."}
            </p>
            {status !== "ARCHIVED" && (
              <Button size="sm" onClick={openCreate}>
                <HiOutlinePlus className="mr-1.5 size-4" />
                Add Account
              </Button>
            )}
          </div>
        )}

        {accounts.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => {
              const balance = Number(a.balance);
              const isDebt = balance < 0;
              const archived = a.status === "ARCHIVED";
              return (
                <div
                  key={a.id}
                  className={`flex flex-col rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-theme-sm dark:border-gray-800 dark:bg-transparent ${
                    archived ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                        {a.type === "CREDIT_CARD" ? (
                          <HiOutlineCreditCard className="size-5" />
                        ) : (
                          <WalletIcon className="size-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-800 dark:text-white/90">
                          {a.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge color={ACCOUNT_TYPE_BADGE_COLOR[a.type]}>
                            {ACCOUNT_TYPE_LABELS[a.type]}
                          </Badge>
                          {archived && <Badge color="gray">Archived</Badge>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        {isDebt ? "Amount owed" : "Balance"}
                      </p>
                      <p
                        className={`mt-0.5 text-title-sm font-semibold ${
                          isDebt
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-800 dark:text-white/90"
                        }`}
                      >
                        {formatMoney(balance, a.currency)}
                      </p>
                    </div>

                    {a.notes && (
                      <p className="line-clamp-2 text-xs text-gray-400">{a.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 px-2 py-1.5 dark:border-gray-800">
                    <span className="px-2 text-xs font-medium text-gray-400">
                      {a.currency}
                    </span>
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setEditing(a);
                          setFormOpen(true);
                        }}
                        className={`${ICON_BUTTON} hover:text-brand-500`}
                        aria-label="Edit account"
                        title="Edit"
                      >
                        <HiOutlinePencil className="size-4" />
                      </button>
                      {a.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleArchive(a)}
                          disabled={busy}
                          className={`${ICON_BUTTON} hover:text-amber-500`}
                          aria-label="Archive account"
                          title="Archive"
                        >
                          <HiOutlineArchive className="size-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestore(a)}
                          disabled={busy}
                          className={`${ICON_BUTTON} hover:text-brand-500`}
                          aria-label="Restore account"
                          title="Restore"
                        >
                          <HiOutlineRefresh className="size-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className={`${ICON_BUTTON} hover:text-red-500`}
                        aria-label="Delete account"
                        title="Delete"
                      >
                        <HiOutlineTrash className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AccountFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => setFormOpen(false)}
        initial={editing}
      />
      <DeleteAccountModal
        account={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => setDeleteTarget(null)}
      />
    </div>
  );
}