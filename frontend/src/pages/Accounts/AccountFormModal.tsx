import { useEffect, useState } from "react";
import {
  Modal, Label, TextInput, Select, Button, HelperText, Alert, ModalBody, ModalFooter, ModalHeader,
} from "flowbite-react";
import { ACCOUNT_TYPE_LABELS } from "../../types/account";
import type { Account, AccountType } from "../../types/account";
import FieldError from "../../common/FieldError";
import { useCreateAccount, useUpdateAccount } from "../../hooks/useAccounts";
import { COMMON_CURRENCIES } from "../../lib/currencies";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Account | null;
  defaultCurrency?: string;
}

export default function AccountFormModal({
  open,
  onClose,
  onSaved,
  initial,
  defaultCurrency,
}: Props) {
  const isEditing = !!initial;

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const loading = createAccount.isPending || updateAccount.isPending;

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [currency, setCurrency] = useState(defaultCurrency ?? "TND");
  const [initialBalance, setInitialBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setType(initial.type);
      setCurrency(initial.currency);
      setNotes(initial.notes ?? "");
      setInitialBalance("");
    } else {
      setName("");
      setType("BANK");
      setCurrency(defaultCurrency ?? "TND");
      setInitialBalance("");
      setNotes("");
    }
    setNameError(undefined);
    setApiError(null);
  }, [initial, open, defaultCurrency]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!name.trim()) {
      setNameError("Account name is required.");
      return;
    }

    try {
      if (isEditing && initial) {
        await updateAccount.mutateAsync({
          id: initial.id,
          data: { name: name.trim(), type, notes: notes.trim() || undefined },
        });
      } else {
        await createAccount.mutateAsync({
          name: name.trim(),
          type,
          currency,
          initialBalance: initialBalance ? Number(initialBalance) : undefined,
          notes: notes.trim() || undefined,
        });
      }
      onSaved();
    } catch (err: any) {
      setApiError(err?.response?.data?.message ?? "Could not save this account.");
    }
  }

  return (
    <Modal show={open} onClose={onClose} size="md">
      <ModalHeader>{isEditing ? "Edit Account" : "Add Account"}</ModalHeader>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <div className="flex flex-col gap-4">
            {apiError && <Alert color="failure">{apiError}</Alert>}

            <div>
              <Label htmlFor="account-name">
                Account Name <span className="text-error-500">*</span>
              </Label>
              <TextInput
                id="account-name"
                placeholder="e.g. Main Checking"
                value={name}
                color={nameError ? "failure" : "gray"}
                aria-invalid={!!nameError}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(undefined);
                }}
              />
              <FieldError message={nameError} />
            </div>

            <div>
              <Label htmlFor="account-type">Type</Label>
              <Select
                id="account-type"
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
              >
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="account-currency">Currency</Label>
              <Select
                id="account-currency"
                value={currency}
                disabled={isEditing}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {!COMMON_CURRENCIES.some((c) => c.code === currency) && (
                  <option value={currency}>{currency}</option>
                )}
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.label}
                  </option>
                ))}
              </Select>
              {isEditing && (
                <HelperText>Currency can't be changed once the account is created.</HelperText>
              )}
            </div>

            {!isEditing && (
              <div>
                <Label htmlFor="account-balance">
                  {type === "CREDIT_CARD" ? "Current Balance Owed" : "Opening Balance"}
                </Label>
                <TextInput
                  id="account-balance"
                  type="number"
                  step="0.001"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0.00"
                />
                <HelperText>
                  {type === "CREDIT_CARD"
                    ? `Enter as a negative number to reflect debt (in ${currency}).`
                    : `Amount in ${currency}.`}
                </HelperText>
              </div>
            )}

            <div>
              <Label htmlFor="account-notes">Notes (optional)</Label>
              <TextInput
                id="account-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Salary lands here"
              />
            </div>

            {isEditing && (
              <p className="text-xs text-gray-400">
                Balance can't be changed here. It updates automatically with transactions.
              </p>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="justify-end">
          <Button color="gray" onClick={onClose} type="button" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Add Account"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}