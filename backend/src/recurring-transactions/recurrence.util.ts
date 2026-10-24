import type { RecurringFrequency } from '../../generated/prisma/enums';
// ^ import enums the same way your accounts DTOs do

const DAY_MS = 86_400_000;

export const utcDay = (d: Date) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);

export const toDayString = (d: Date) => d.toISOString().slice(0, 10);

export function parseDay(s: string): Date {
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${s}`);
  return d;
}

/** start + n months, clamped to the end of the target month (Jan 31 + 1 month = Feb 28/29). */
export function addMonthsClamped(start: Date, months: number): Date {
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(start.getUTCDate(), lastDay)));
}

/** The k-th occurrence (k = 0 is the start date). Always computed from the start to avoid drift. */
export function occurrence(
  start: Date,
  frequency: RecurringFrequency,
  interval: number,
  k: number,
): Date {
  switch (frequency) {
    case 'DAILY':   return addDays(start, k * interval);
    case 'WEEKLY':  return addDays(start, k * interval * 7);
    case 'MONTHLY': return addMonthsClamped(start, k * interval);
    case 'YEARLY':  return addMonthsClamped(start, k * interval * 12);
  }
}

/** First occurrence strictly after `after`. */
export function nextOccurrenceAfter(
  start: Date,
  frequency: RecurringFrequency,
  interval: number,
  after: Date,
): Date {
  const monthStep =
    frequency === 'MONTHLY' ? interval : frequency === 'YEARLY' ? interval * 12 : 0;

  // jump close to the answer, then walk forward
  let k: number;
  if (monthStep) {
    const diff =
      (after.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (after.getUTCMonth() - start.getUTCMonth());
    k = Math.max(0, Math.floor(diff / monthStep) - 1);
  } else {
    const stepMs = (frequency === 'DAILY' ? 1 : 7) * interval * DAY_MS;
    k = Math.max(0, Math.floor((after.getTime() - start.getTime()) / stepMs) - 1);
  }

  while (occurrence(start, frequency, interval, k).getTime() <= after.getTime()) k++;
  return occurrence(start, frequency, interval, k);
}