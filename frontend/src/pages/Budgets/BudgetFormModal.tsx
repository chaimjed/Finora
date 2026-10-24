import { useEffect, useState } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter, Label, TextInput, Select, Button, HelperText, Alert,
} from "flowbite-react";
import type { BudgetItem, ExpenseCategory } from "../../types/budget";
import { apiErrorMessage, useBudgetsStore } from "../../store/budgetsStore";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: BudgetItem | null;
  categories: ExpenseCategory[];
  usedCategoryIds: string[];
  month: string;
}

export default function BudgetFormModal({
  open, onClose, initial, categories, usedCategoryIds, month,
}: Props) {
  const { create, update } = useBudgetsStore();

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [threshold, setThreshold] = useState("80");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const available = categories.filter((c) => !usedCategoryIds.includes(c.id));

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setCategoryId(initial.category.id);
      setAmount(String(initial.amount));
      setThreshold(String(initial.warningThresholdPercent));
    } else {
      setCategoryId(available[0]?.id ?? "");
      setAmount("");
      setThreshold("80");
    }
    setErrors({});
    setServerError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, open]);

  const validate = () => {
    const next: Record<string, string> = {};
    const a = parseFloat(amount);
    const t = parseInt(threshold, 10);
    if (!a || a <= 0) next.amount = "Amount must be greater than 0";
    if (!t || t < 1 || t > 100) next.threshold = "Threshold must be between 1 and 100";
    if (!initial && !categoryId) next.category = "Choose a category";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const payload = {
        amount: parseFloat(amount),
        warningThresholdPercent: parseInt(threshold, 10),
      };
      if (initial) await update(initial.id, payload);
      else await create({ categoryId, ...payload });
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={open} onClose={onClose} size="md">
      <ModalHeader>{initial ? "Edit Budget" : `Add Budget · ${month}`}</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="flex flex-col gap-4">
            {serverError && <Alert color="failure">{serverError}</Alert>}

            <div>
              <Label htmlFor="category">Category</Label>
              {initial ? (
                <TextInput id="category" value={initial.category.name} disabled />
              ) : (
                <Select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              )}
              {!initial && available.length === 0 && (
                <HelperText color="warning">Every expense category already has a budget this month.</HelperText>
              )}
              {errors.category && <HelperText color="failure">{errors.category}</HelperText>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Monthly limit</Label>
                <TextInput
                  id="amount"
                  type="number"
                  step="0.001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  color={errors.amount ? "failure" : undefined}
                />
                {errors.amount && <HelperText color="failure">{errors.amount}</HelperText>}
              </div>
              <div>
                <Label htmlFor="threshold">Warn at (%)</Label>
                <TextInput
                  id="threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  color={errors.threshold ? "failure" : undefined}
                />
                {errors.threshold && <HelperText color="failure">{errors.threshold}</HelperText>}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="gray" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting || (!initial && available.length === 0)}>
            {initial ? "Save Changes" : "Add Budget"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}