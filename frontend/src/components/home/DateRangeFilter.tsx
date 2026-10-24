// components/dashboard/DateRangeFilter.tsx
import { useEffect, useState } from "react";
import { Button, Select, TextInput } from "flowbite-react";
import { useDashboardStore, type Preset } from "../../store/dashboardStore";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "last3Months", label: "Last 3 months" },
  { value: "thisYear", label: "This year" },
  { value: "custom", label: "Custom range" },
];

export default function DateRangeFilter() {
  const { preset, range, setPreset, chooseCustom, setCustomRange } = useDashboardStore();
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  useEffect(() => {
    setFrom(range.from);
    setTo(range.to);
  }, [range]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        aria-label="Period"
        value={preset}
        onChange={(e) => {
          const v = e.target.value as Preset;
          if (v === "custom") chooseCustom();
          else setPreset(v);
        }}
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </Select>

      {preset === "custom" && (
        <>
          <TextInput type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
          <TextInput type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} aria-label="To" />
          <Button onClick={() => setCustomRange(from, to)}>Apply</Button>
        </>
      )}
    </div>
  );
}