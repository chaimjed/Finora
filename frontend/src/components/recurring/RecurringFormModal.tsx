import { useEffect, useState } from "react";
import {
  Alert, Button, HelperText, Label, Modal, ModalBody, ModalFooter, ModalHeader, Select, TextInput,
} from "flowbite-react";
import type { TxType } from "../../types/dashboard";
import type { Frequency, RecurringRule } from "../../types/recurring";
import { todayStr } from "./recurringUtils";
import { useRecurringStore } from "../../store/recurringStore";
import { apiErrorMessage } from "../../store/budgetsStore";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: RecurringRule | null;
}

export default function RecurringFormModal({ open, onClose, initial }: Props) {
  const { accounts, expenseCategories, incomeCategories, create, update } = useRecurringStore();
  const editing = !!initial;

  const [type, setType] = useState<TxType>("EXPENSE");
  const [accountId, setAccountId] = useState("");
  const [relatedAccountId, setRelatedAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");
  const [interval, setIntervalCount] = useState("1");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setType(initial.type);
      setAccountId(initial.account.id);
      setRelatedAccountId(initial.relatedAccount?.id ?? "");
      setCategoryId(initial.category?.id ?? "");
      setAmount(String(initial.amount));
      setFrequency(initial.frequency);
      setIntervalCount(String(initial.intervalCount));
      setStartDate(initial.startDate);
      setEndDate(initial.endDate ?? "");
      setDescription(initial.description ?? "");
    } else {
      setType("EXPENSE");
      setAccountId(accounts[0]?.id ?? "");
      setRelatedAccountId("");
      setCategoryId("");
      setAmount("");
      setFrequency("MONTHLY");
      setIntervalCount("1");
      setStartDate(todayStr());
      setEndDate("");
      setDescription("");
    }
    setErrors({});
    setServerError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const source = accounts.find((a) => a.id === accountId);
  // recurring transfers only support accounts with the same currency
  const destinations = accounts.filter((a) => a.id !== accountId && a.currency === source?.currency);
  const categories = type === "INCOME" ? incomeCategories : expenseCategories;
  const isTransfer = type === "TRANSFER";

  const validate = () => {
    const next: Record<string, string> = {};
    const a = parseFloat(amount);
    const n = parseInt(interval, 10);
    if (!a || a <= 0) next.amount = "Amount must be greater than 0";
    if (!editing) {
      if (!accountId) next.account = "Choose an account";
      if (isTransfer && !relatedAccountId) next.related = "Choose a destination account";
      if (!n || n < 1 || n > 365) next.interval = "Between 1 and 365";
      if (!startDate) next.startDate = "Choose a start date";
      else if (startDate < todayStr()) next.startDate = "The start date cannot be in the past";
    }
    if (endDate && endDate < startDate) next.endDate = "Must be on or after the start date";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      if (initial) {
        await update(initial.id, {
          amount: parseFloat(amount),
          description: description.trim(),
          endDate: endDate || null,
          ...(!isTransfer && categoryId !== (initial.category?.id ?? "")
            ? { categoryId: categoryId || null }
            : {}),
        });
      } else {
        await create({
          type,
          accountId,
          amount: parseFloat(amount),
          frequency,
          intervalCount: parseInt(interval, 10),
          startDate,
          ...(endDate && { endDate }),
          ...(isTransfer ? { relatedAccountId } : categoryId ? { categoryId } : {}),
          ...(description.trim() && { description: description.trim() }),
        });
      }
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={open} onClose={onClose} size="lg">
      <ModalHeader>{editing ? "Edit Recurring Payment" : "Add Recurring Payment"}</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="flex flex-col gap-4">
            {serverError && <Alert color="failure">{serverError}</Alert>}
            {editing && (
              <Alert color="info">
                To change the schedule or the account, delete this rule and create a new one.
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  id="type"
                  value={type}
                  disabled={editing}
                  onChange={(e) => { setType(e.target.value as TxType); setCategoryId(""); setRelatedAccountId(""); }}
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                  <option value="TRANSFER">Transfer</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount {source ? `(${source.currency})` : ""}</Label>
                <TextInput
                  id="amount" type="number" step="0.001" min="0" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  color={errors.amount ? "failure" : undefined}
                />
                {errors.amount && <HelperText color="failure">{errors.amount}</HelperText>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="account">{isTransfer ? "From account" : "Account"}</Label>
                <Select
                  id="account" value={accountId} disabled={editing}
                  onChange={(e) => { setAccountId(e.target.value); setRelatedAccountId(""); }}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                  ))}
                </Select>
                {errors.account && <HelperText color="failure">{errors.account}</HelperText>}
              </div>

              {isTransfer ? (
                <div>
                  <Label htmlFor="related">To account</Label>
                  <Select
                    id="related" value={relatedAccountId} disabled={editing}
                    onChange={(e) => setRelatedAccountId(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {destinations.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                    ))}
                  </Select>
                  <HelperText>Only accounts with the same currency are listed.</HelperText>
                  {errors.related && <HelperText color="failure">{errors.related}</HelperText>}
                </div>
              ) : (
                <div>
                  <Label htmlFor="category">Category (optional)</Label>
                  <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">Repeats</Label>
                <Select
                  id="frequency" value={frequency} disabled={editing}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="interval">Every N</Label>
                <TextInput
                  id="interval" type="number" min="1" max="365" value={interval} disabled={editing}
                  onChange={(e) => setIntervalCount(e.target.value)}
                  color={errors.interval ? "failure" : undefined}
                />
                {errors.interval && <HelperText color="failure">{errors.interval}</HelperText>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start">Start date</Label>
                <TextInput
                  id="start" type="date" value={startDate} min={todayStr()} disabled={editing}
                  onChange={(e) => setStartDate(e.target.value)}
                  color={errors.startDate ? "failure" : undefined}
                />
                {errors.startDate && <HelperText color="failure">{errors.startDate}</HelperText>}
              </div>
              <div>
                <Label htmlFor="end">End date (optional)</Label>
                <TextInput
                  id="end" type="date" value={endDate} min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  color={errors.endDate ? "failure" : undefined}
                />
                {errors.endDate && <HelperText color="failure">{errors.endDate}</HelperText>}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Name / description</Label>
              <TextInput
                id="description" maxLength={255} placeholder="e.g. Netflix, Apartment rent"
                value={description} onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="gray" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting || accounts.length === 0}>
            {editing ? "Save Changes" : "Add Recurring Payment"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}