import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Button, HelperText, Label, Modal, ModalBody, ModalFooter, ModalHeader, Select, Textarea, TextInput,
} from "flowbite-react";
import FieldError from "../../common/FieldError";
import CategoryOptions from "../../common/CategoryOptions";
import { useCategories } from "../../hooks/useCategories";
import { useUpdateTransaction } from "../../hooks/useTransactions";
import type { Transaction, UpdateTransactionPayload } from "../../services/transactionsService";

interface Props {
  target: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}

const FORM_ID = "edit-transaction-form";

type FieldName = "amount" | "date" | "rate";
type FieldErrors = Partial<Record<FieldName, string>>;

const TYPE_LABEL = { INCOME: "Income", EXPENSE: "Expense", TRANSFER: "Transfer" } as const;

function toDestination(amount: string, rate: string) {
  const a = Number(amount);
  const r = Number(rate);
  return a > 0 && r > 0 ? (a * r).toFixed(3) : "";
}

export default function EditTransactionModal({ target, onClose, onSaved }: Props) {
  const categoriesQuery = useCategories({ status: "ALL" });
  const updateTransaction = useUpdateTransaction();
  const loading = updateTransaction.isPending;

  const activeCategories = useMemo(
    () => (categoriesQuery.data ?? []).filter((c) => c.status === "ACTIVE"),
    [categoriesQuery.data],
  );

  const [amount, setAmount] = useState("");
  const [destinationAmount, setDestinationAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Keeps the rate in sync with the received amount without fighting the user's typing.
  const rateTouchedRef = useRef(false);

  useEffect(() => {
    if (!target) return;
    rateTouchedRef.current = false;
    setAmount(String(Number(target.amount)));
    setDestinationAmount(target.destinationAmount !== null ? String(Number(target.destinationAmount)) : "");
    setExchangeRate(target.exchangeRate !== null ? String(Number(target.exchangeRate)) : "");
    setCategoryId(target.categoryId ?? "");
    setDate(target.date.slice(0, 10));
    setDescription(target.description ?? "");
    setNotes(target.notes ?? "");
    setError(null);
    setFieldErrors({});
  }, [target]);

  const crossCurrency =
    !!target &&
    target.type === "TRANSFER" &&
    !!target.relatedAccount &&
    target.relatedAccount.currency !== target.account.currency;

  const sourceCurrency = target?.account.currency;
  const destCurrency = target?.relatedAccount?.currency;

  function clearFieldError(field: FieldName) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function handleAmountChange(value: string) {
    setAmount(value);
    clearFieldError("amount");
    if (crossCurrency && Number(exchangeRate) > 0) {
      setDestinationAmount(toDestination(value, exchangeRate));
    }
  }

  function handleRateChange(value: string) {
    rateTouchedRef.current = true;
    clearFieldError("rate");
    setExchangeRate(value);
    setDestinationAmount(toDestination(amount, value));
  }

  function handleDestinationChange(value: string) {
    rateTouchedRef.current = true;
    clearFieldError("rate");
    setDestinationAmount(value);
    const a = Number(amount);
    const d = Number(value);
    if (a > 0 && d > 0) setExchangeRate((d / a).toFixed(8));
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!amount) errors.amount = "Amount is required.";
    else if (!(Number(amount) > 0)) errors.amount = "Amount must be greater than 0.";
    if (!date) errors.date = "Date is required.";
    if (crossCurrency && !(Number(exchangeRate) > 0) && !(Number(destinationAmount) > 0)) {
      errors.rate = "Enter an exchange rate or the amount received.";
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const newAmount = Number(amount);
    const amountChanged = newAmount !== Number(target.amount);

    const payload: UpdateTransactionPayload = {
      date,
      description: description.trim() || null,
      notes: notes.trim() || null,
    };

    if (target.type !== "TRANSFER" && categoryId !== (target.categoryId ?? "")) {
      payload.categoryId = categoryId || null;
    }

    if (crossCurrency) {
      const destChanged = Number(destinationAmount) !== Number(target.destinationAmount ?? 0);
      const rateChanged = Number(exchangeRate) !== Number(target.exchangeRate ?? 0);
      if (amountChanged || destChanged || rateChanged) {
        payload.amount = newAmount;
        if (Number(destinationAmount) > 0) payload.destinationAmount = Number(destinationAmount);
        if (Number(exchangeRate) > 0) payload.exchangeRate = Number(exchangeRate);
      }
    } else if (amountChanged) {
      payload.amount = newAmount;
    }

    try {
      await updateTransaction.mutateAsync({ id: target.id, data: payload });
      onSaved();
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(", ") : (message ?? "Could not update transaction."));
    }
  }

  const currentCategory = target?.category;
  const currentCategoryMissing =
    !!currentCategory && !activeCategories.some((c) => c.id === currentCategory.id);

  return (
    <Modal show={!!target} onClose={onClose} size="xl">
      <ModalHeader>Edit transaction</ModalHeader>

      <ModalBody>
        {target && (
          <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {error && <Alert color="failure">{error}</Alert>}

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
              <span className="font-medium">{TYPE_LABEL[target.type]}</span>
              {" · "}
              {target.account.name}
              {target.relatedAccount && <> → {target.relatedAccount.name}</>}
              <p className="mt-1 text-xs text-gray-400">
                The type and accounts can't be changed. Delete and recreate the transaction instead.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-tx-amount">
                  Amount ({sourceCurrency}) <span className="text-error-500">*</span>
                </Label>
                <TextInput
                  id="edit-tx-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  color={fieldErrors.amount ? "failure" : "gray"}
                  aria-invalid={!!fieldErrors.amount}
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                />
                <FieldError message={fieldErrors.amount} />
              </div>
              <div>
                <Label htmlFor="edit-tx-date">
                  Date <span className="text-error-500">*</span>
                </Label>
                <TextInput
                  id="edit-tx-date"
                  type="date"
                  color={fieldErrors.date ? "failure" : "gray"}
                  aria-invalid={!!fieldErrors.date}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    clearFieldError("date");
                  }}
                />
                <FieldError message={fieldErrors.date} />
              </div>
            </div>

            {crossCurrency && sourceCurrency && destCurrency && (
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
                <p className="mb-3 text-xs font-medium text-gray-600 dark:text-gray-300">
                  Cross-currency transfer · {sourceCurrency} → {destCurrency}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-tx-rate">Exchange rate</Label>
                    <TextInput
                      id="edit-tx-rate"
                      type="number"
                      step="any"
                      color={fieldErrors.rate ? "failure" : "gray"}
                      value={exchangeRate}
                      onChange={(e) => handleRateChange(e.target.value)}
                    />
                    {Number(exchangeRate) > 0 && (
                      <HelperText>
                        1 {sourceCurrency} = {Number(exchangeRate)} {destCurrency}
                      </HelperText>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-tx-dest-amount">Amount received ({destCurrency})</Label>
                    <TextInput
                      id="edit-tx-dest-amount"
                      type="number"
                      step="0.001"
                      color={fieldErrors.rate ? "failure" : "gray"}
                      value={destinationAmount}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                    />
                    <HelperText>Adjust it if your bank applied a different rate.</HelperText>
                  </div>
                </div>
                <FieldError message={fieldErrors.rate} />
              </div>
            )}

            {target.type !== "TRANSFER" && (
              <div>
                <Label htmlFor="edit-tx-category">Category</Label>
                <Select
                  id="edit-tx-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">No category</option>
                  {currentCategoryMissing && currentCategory && (
                    <option value={currentCategory.id}>{currentCategory.name} (archived)</option>
                  )}
                  <CategoryOptions categories={activeCategories} type={target.type} />
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="edit-tx-description">Description (optional)</Label>
              <TextInput
                id="edit-tx-description"
                placeholder="e.g. Grocery run"
                maxLength={255}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-tx-notes">Notes (optional)</Label>
              <Textarea
                id="edit-tx-notes"
                rows={3}
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </form>
        )}
      </ModalBody>

      <ModalFooter className="justify-end">
        <Button color="gray" type="button" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form={FORM_ID} disabled={loading || !target}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}