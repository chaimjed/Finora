import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Button, HelperText, Label, Modal, ModalBody, ModalFooter, ModalHeader, Select, TextInput,
} from "flowbite-react";
import {
  HiOutlineArrowsRightLeft, HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp,
} from "react-icons/hi2";
import { cn } from "../../utils";
import FieldError from "../../common/FieldError";
import { useAccounts } from "../../hooks/useAccounts";
import { useCategories } from "../../hooks/useCategories";
import { useCreateTransaction } from "../../hooks/useTransactions";
import type { CreateTransactionPayload, TransactionType } from "../../services/transactionsService";
import { exchangeRateService } from "../../services/exchangeRateService";
import CategoryOptions from "../../common/CategoryOptions";

interface Props {
  show: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const FORM_ID = "transaction-form";

type FieldName = "accountId" | "relatedAccountId" | "amount" | "date" | "rate";
type FieldErrors = Partial<Record<FieldName, string>>;

const TYPE_OPTIONS: { value: TransactionType; label: string; icon: React.ReactNode; active: string }[] = [
  {
    value: "EXPENSE",
    label: "Expense",
    icon: <HiOutlineArrowTrendingDown className="size-4" />,
    active: "border-error-500 bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
  },
  {
    value: "INCOME",
    label: "Income",
    icon: <HiOutlineArrowTrendingUp className="size-4" />,
    active: "border-success-500 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  },
  {
    value: "TRANSFER",
    label: "Transfer",
    icon: <HiOutlineArrowsRightLeft className="size-4" />,
    active: "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400",
  },
];

function todayLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function toDestination(amount: string, rate: string) {
  const a = Number(amount);
  const r = Number(rate);
  return a > 0 && r > 0 ? (a * r).toFixed(3) : "";
}

export default function TransactionFormModal({ show, onClose, onCreated }: Props) {
  const accountsQuery = useAccounts("ALL");
  const categoriesQuery = useCategories({ status: "ALL" });
  const createTransaction = useCreateTransaction();
  const loading = createTransaction.isPending;

  const accounts = useMemo(
    () => (accountsQuery.data ?? []).filter((a) => a.status === "ACTIVE"),
    [accountsQuery.data],
  );
  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter((c) => c.status === "ACTIVE"),
    [categoriesQuery.data],
  );
  const accountsLoading = accountsQuery.isPending;
  const loadError = accountsQuery.isError || categoriesQuery.isError;

  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [accountId, setAccountId] = useState("");
  const [relatedAccountId, setRelatedAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [destinationAmount, setDestinationAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [description, setDescription] = useState("");

  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState(false);
  const [rateStale, setRateStale] = useState(false);
  const [rateSource, setRateSource] = useState<"frankfurter" | "exchangerate-api" | null>(null);
  const rateTouchedRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const amountRef = useRef("");
  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);

  function clearFieldError(field: FieldName) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  useEffect(() => {
    if (!show) return;
    setType("EXPENSE");
    setAccountId("");
    setRelatedAccountId("");
    setCategoryId("");
    setAmount("");
    setDestinationAmount("");
    setExchangeRate("");
    setDate(todayLocal());
    setDescription("");
    setRateError(false);
    setError(null);
    setFieldErrors({});
  }, [show]);

  const sourceAccount = accounts.find((a) => a.id === accountId);
  const destAccount = accounts.find((a) => a.id === relatedAccountId);
  const sourceCurrency = sourceAccount?.currency;
  const destCurrency = destAccount?.currency;
  const crossCurrency =
    type === "TRANSFER" && !!sourceCurrency && !!destCurrency && sourceCurrency !== destCurrency;

  useEffect(() => {
    if (!crossCurrency || !sourceCurrency || !destCurrency) {
      setExchangeRate("");
      setDestinationAmount("");
      setRateError(false);
      setRateStale(false);
      setRateSource(null);
      return;
    }

    rateTouchedRef.current = false;
    let cancelled = false;
    setRateLoading(true);
    setRateError(false);
    setRateStale(false);

    exchangeRateService
      .getRate(sourceCurrency, destCurrency)
      .then(({ data }) => {
        if (cancelled || rateTouchedRef.current) return;
        const rate = String(data.rate);
        setExchangeRate(rate);
        setDestinationAmount(toDestination(amountRef.current, rate));
        setRateStale(data.stale);
        setRateSource(data.source);
      })
      .catch(() => {
        if (!cancelled) setRateError(true);
      })
      .finally(() => {
        if (!cancelled) setRateLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [crossCurrency, sourceCurrency, destCurrency]);

  function handleAmountChange(value: string) {
    setAmount(value);
    clearFieldError("amount");
    if (crossCurrency) setDestinationAmount(toDestination(value, exchangeRate));
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

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategoryId("");
    setFieldErrors({});
    if (next !== "TRANSFER") setRelatedAccountId("");
  }

  function handleSourceChange(id: string) {
    setAccountId(id);
    clearFieldError("accountId");
    if (id === relatedAccountId) setRelatedAccountId("");
  }

  const relatedAccountOptions = accounts.filter((a) => a.id !== accountId);
  const noAccounts = !accountsLoading && !accountsQuery.isError && accounts.length === 0;

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!accountId) errors.accountId = type === "TRANSFER" ? "Select the source account." : "Select an account.";
    if (type === "TRANSFER" && !relatedAccountId) errors.relatedAccountId = "Select a destination account.";

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
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: CreateTransactionPayload = {
      type,
      accountId,
      relatedAccountId: type === "TRANSFER" ? relatedAccountId : undefined,
      categoryId: type !== "TRANSFER" && categoryId ? categoryId : undefined,
      amount: Number(amount),
      date,
      description: description.trim() || undefined,
      ...(crossCurrency && {
        exchangeRate: Number(exchangeRate) > 0 ? Number(exchangeRate) : undefined,
        destinationAmount: Number(destinationAmount) > 0 ? Number(destinationAmount) : undefined,
      }),
    };

    try {
      await createTransaction.mutateAsync(payload);
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not create transaction.");
    }
  }

  return (
    <Modal show={show} onClose={onClose} size="xl">
      <ModalHeader>New transaction</ModalHeader>

      <ModalBody>
        <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {error && <Alert color="failure">{error}</Alert>}
          {loadError && <Alert color="failure">Could not load your accounts and categories.</Alert>}
          {noAccounts && (
            <Alert color="info">You need at least one active account before adding a transaction.</Alert>
          )}

          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Transaction type">
            {TYPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={type === o.value}
                onClick={() => handleTypeChange(o.value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  type === o.value
                    ? o.active
                    : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5",
                )}
              >
                {o.icon}
                {o.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tx-account">
                {type === "TRANSFER" ? "From account" : "Account"} <span className="text-error-500">*</span>
              </Label>
              <Select
                id="tx-account"
                value={accountId}
                color={fieldErrors.accountId ? "failure" : "gray"}
                aria-invalid={!!fieldErrors.accountId}
                onChange={(e) => handleSourceChange(e.target.value)}
              >
                <option value="">Select an account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </Select>
              <FieldError message={fieldErrors.accountId} />
            </div>

            {type === "TRANSFER" ? (
              <div>
                <Label htmlFor="tx-related">
                  To account <span className="text-error-500">*</span>
                </Label>
                <Select
                  id="tx-related"
                  value={relatedAccountId}
                  color={fieldErrors.relatedAccountId ? "failure" : "gray"}
                  aria-invalid={!!fieldErrors.relatedAccountId}
                  onChange={(e) => {
                    setRelatedAccountId(e.target.value);
                    clearFieldError("relatedAccountId");
                  }}
                >
                  <option value="">Select a destination</option>
                  {relatedAccountOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </Select>
                <FieldError message={fieldErrors.relatedAccountId} />
              </div>
            ) : (
              <div>
                <Label htmlFor="tx-category">Category</Label>
<Select id="tx-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
  <option value="">No category</option>
  <CategoryOptions categories={categories} type={type} />
</Select>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tx-amount">
                Amount{sourceCurrency ? ` (${sourceCurrency})` : ""} <span className="text-error-500">*</span>
              </Label>
              <TextInput
                id="tx-amount"
                type="number"
                inputMode="decimal"
                step="0.001"
                placeholder="0.000"
                color={fieldErrors.amount ? "failure" : "gray"}
                aria-invalid={!!fieldErrors.amount}
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
              <FieldError message={fieldErrors.amount} />
            </div>
            <div>
              <Label htmlFor="tx-date">
                Date <span className="text-error-500">*</span>
              </Label>
              <TextInput
                id="tx-date"
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
                  <Label htmlFor="tx-rate">Exchange rate</Label>
                  <TextInput
                    id="tx-rate"
                    type="number"
                    step="any"
                    color={fieldErrors.rate ? "failure" : "gray"}
                    value={exchangeRate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    disabled={rateLoading}
                  />
                  {!rateLoading && !rateError && exchangeRate && (
                    <HelperText>
                      1 {sourceCurrency} = {Number(exchangeRate)} {destCurrency}
                      {rateStale && " · last known rate, may be outdated"}
                    </HelperText>
                  )}
                  {rateError && (
                    <HelperText>Could not fetch the rate. Enter it manually.</HelperText>
                  )}
                  {rateSource === "exchangerate-api" && (
                    <HelperText>
                      <a
                        href="https://www.exchangerate-api.com"
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Rates by Exchange Rate API
                      </a>
                    </HelperText>
                  )}
                </div>
                <div>
                  <Label htmlFor="tx-dest-amount">Amount received ({destCurrency})</Label>
                  <TextInput
                    id="tx-dest-amount"
                    type="number"
                    step="0.001"
                    color={fieldErrors.rate ? "failure" : "gray"}
                    value={destinationAmount}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                  />
                  <HelperText>Adjust it if your bank applies a different rate.</HelperText>
                </div>
              </div>
              <FieldError message={fieldErrors.rate} />
            </div>
          )}

          <div>
            <Label htmlFor="tx-description">Description (optional)</Label>
            <TextInput
              id="tx-description"
              placeholder="e.g. Grocery run"
              maxLength={255}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </form>
      </ModalBody>

      <ModalFooter className="justify-end">
        <Button color="gray" type="button" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form={FORM_ID} disabled={loading || accountsLoading || noAccounts}>
          {loading ? "Saving..." : "Create transaction"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}