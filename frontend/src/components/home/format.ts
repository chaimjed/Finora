// components/dashboard/format.ts
export const money = (n: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);

export const compact = (n: number) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short" });

export function periodLabel(period: string, granularity: "day" | "month") {
  const d = new Date(granularity === "day" ? `${period}T00:00:00Z` : `${period}-01T00:00:00Z`);
  return d.toLocaleDateString(
    undefined,
    granularity === "day"
      ? { day: "2-digit", month: "short", timeZone: "UTC" }
      : { month: "short", year: "2-digit", timeZone: "UTC" },
  );
}