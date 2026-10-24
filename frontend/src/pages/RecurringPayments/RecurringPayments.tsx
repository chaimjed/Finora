import { useEffect, useState } from "react";
import { Alert, Badge, Button, Select, Spinner } from "flowbite-react";
import {
  HiOutlinePause, HiOutlinePencil, HiOutlinePlay, HiOutlinePlus, HiOutlineTrash, HiOutlineLightningBolt,
} from "react-icons/hi";
import { CalenderIcon } from "../../icons";
import type { RecurringRule, RecurringStatus } from "../../types/recurring";
import { fmtDay, frequencyLabel } from "../../components/recurring/recurringUtils";
import RecurringFormModal from "../../components/recurring/RecurringFormModal";
import ConfirmModal from "../../components/recurring/ConfirmModal";
import { useRecurringStore } from "../../store/recurringStore";
import { money } from "../../components/home/format";

const STATUS_BADGE: Record<RecurringStatus, { color: string; label: string }> = {
  ACTIVE: { color: "success", label: "Active" },
  PAUSED: { color: "gray", label: "Paused" },
  COMPLETED: { color: "info", label: "Completed" },
};

const amountTone = (t: RecurringRule["type"]) =>
  t === "INCOME"
    ? "text-green-600 dark:text-green-400"
    : t === "EXPENSE"
      ? "text-red-600 dark:text-red-400"
      : "text-gray-800 dark:text-white/90";

export default function RecurringPayments() {
  const {
    rules, statusFilter, loading, processing, error, info,
    load, loadRefs, setStatusFilter, pause, resume, remove, processNow, clearMessages,
  } = useRecurringStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringRule | null>(null);

  useEffect(() => {
    load();
    loadRefs();
  }, [load, loadRefs]);

  const titleOf = (r: RecurringRule) =>
    r.description || r.category?.name || (r.type === "TRANSFER" ? "Transfer" : "Recurring payment");

  const subtitleOf = (r: RecurringRule) =>
    r.type === "TRANSFER" && r.relatedAccount
      ? `${r.account.name} → ${r.relatedAccount.name}`
      : [r.category?.name, r.account.name].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-6">
      {error && <Alert color="failure" onDismiss={clearMessages}>{error}</Alert>}
      {info && <Alert color="success" onDismiss={clearMessages}>{info}</Alert>}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recurring Payments</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Subscriptions and bills that repeat automatically
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | RecurringStatus)}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
            </Select>
            <Button color="gray" onClick={processNow} disabled={processing}>
              {processing ? <Spinner size="sm" className="mr-2" /> : <HiOutlineLightningBolt className="mr-2 size-5" />}
              Process due now
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <HiOutlinePlus className="mr-2 size-5" />
              Add Recurring Payment
            </Button>
          </div>
        </div>

        {loading && rules.length === 0 ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : rules.length === 0 ? (
          <p className="py-16 text-center text-gray-500 dark:text-gray-400">
            No recurring payments{statusFilter ? " with this status" : " yet"}. Add one to automate a bill or subscription.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((r) => {
              const badge = STATUS_BADGE[r.status];
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                        <CalenderIcon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-800 dark:text-white/90">{titleOf(r)}</p>
                        <p className="truncate text-xs text-gray-400">{subtitleOf(r)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div className="text-sm">
                        <p className="text-gray-400">Amount</p>
                        <p className={`font-medium ${amountTone(r.type)}`}>{money(r.amount, r.currency)}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-400">Frequency</p>
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {frequencyLabel(r.frequency, r.intervalCount)}
                        </p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-400">{r.status === "COMPLETED" ? "Last run" : "Next due"}</p>
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {r.status === "COMPLETED"
                            ? r.lastExecutionDate ? fmtDay(r.lastExecutionDate) : "—"
                            : fmtDay(r.nextExecutionDate)}
                        </p>
                      </div>
                      <Badge color={badge.color}>{badge.label}</Badge>

                      <div className="flex items-center gap-2">
                        {r.status === "ACTIVE" && (
                          <button
                            onClick={() => pause(r.id)} aria-label="Pause"
                            className="text-gray-500 hover:text-yellow-500 dark:text-gray-400"
                          >
                            <HiOutlinePause className="size-5" />
                          </button>
                        )}
                        {r.status === "PAUSED" && (
                          <button
                            onClick={() => resume(r.id)} aria-label="Resume"
                            className="text-gray-500 hover:text-green-500 dark:text-gray-400"
                          >
                            <HiOutlinePlay className="size-5" />
                          </button>
                        )}
                        {r.status !== "COMPLETED" && (
                          <button
                            onClick={() => { setEditing(r); setFormOpen(true); }} aria-label="Edit"
                            className="text-gray-500 hover:text-brand-500 dark:text-gray-400"
                          >
                            <HiOutlinePencil className="size-5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(r)} aria-label="Delete"
                          className="text-gray-500 hover:text-red-500 dark:text-gray-400"
                        >
                          <HiOutlineTrash className="size-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {r.consecutiveFailures > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {r.status === "PAUSED"
                        ? `Paused automatically after ${r.consecutiveFailures} failed attempts. Fix the problem, then resume. `
                        : `Last attempt failed (${r.consecutiveFailures}×). It will be retried. `}
                      {r.lastError && <span className="text-gray-400">({r.lastError})</span>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RecurringFormModal open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete recurring payment"
        message={`Delete "${deleteTarget ? titleOf(deleteTarget) : ""}"? Transactions it already created are kept.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}