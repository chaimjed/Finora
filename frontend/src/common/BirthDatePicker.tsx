import { Datepicker } from "flowbite-react";

interface BirthDatePickerProps {
  value?: string;
  onChange: (isoDate: string | undefined) => void;
  id?: string;
  hasError?: boolean;
}

function parseLocal(value?: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function formatLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function BirthDatePicker({
  value,
  onChange,
  id,
  hasError,
}: BirthDatePickerProps) {
  return (
    <Datepicker
      id={id}
      maxDate={new Date()}
      placeholder="Select date of birth"
      color={hasError ? "failure" : "gray"}
      aria-invalid={!!hasError}
      value={parseLocal(value) ?? null}
      onChange={(date: Date | null) =>
        onChange(date ? formatLocal(date) : undefined)
      }
    />
  );
}
