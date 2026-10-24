import type { Frequency } from "../../types/recurring";

const UNIT: Record<Frequency, [string, string]> = {
  DAILY: ["Daily", "day"],
  WEEKLY: ["Weekly", "week"],
  MONTHLY: ["Monthly", "month"],
  YEARLY: ["Yearly", "year"],
};

export function frequencyLabel(f: Frequency, n: number) {
  const [label, unit] = UNIT[f];
  return n === 1 ? label : `Every ${n} ${unit}s`;
}

/** 'YYYY-MM-DD' -> '01 Nov 2026' (rule dates are UTC calendar days) */
export const fmtDay = (s: string) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString(undefined, {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  });

/** Today as YYYY-MM-DD in the browser's local time. */
export function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}