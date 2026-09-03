import { addDays, diffDays } from "./dates";
import type { PeriodRange } from "./period-ranges";

export type CycleRow = {
  start: string;
  end: string;
  periodDays: number;
  cycleDays: number;
  isCurrent: boolean;
};

export function getCycleDay(
  ranges: PeriodRange[],
  date: string,
): number | null {
  let start: string | null = null;
  for (const range of ranges) {
    if (range.start <= date) start = range.start;
  }
  if (!start) return null;
  return diffDays(start, date) + 1;
}

export function getCycleRows(
  ranges: PeriodRange[],
  today: string,
): CycleRow[] {
  const rows: CycleRow[] = [];

  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    if (!range) continue;

    const next = ranges[index + 1];
    const isCurrent = next == null;
    const end = next ? addDays(next.start, -1) : today;
    const span = diffDays(range.start, end) + 1;

    rows.push({
      start: range.start,
      end,
      periodDays: range.dates.length,
      cycleDays: Math.max(span, range.dates.length),
      isCurrent,
    });
  }

  return rows.reverse();
}

export function getAverageCycleLength(rows: CycleRow[]): number | null {
  const completed = rows.filter((row) => !row.isCurrent);
  if (completed.length === 0) return null;

  const total = completed.reduce((sum, row) => sum + row.cycleDays, 0);
  return Math.round(total / completed.length);
}

export function getAveragePeriodDays(rows: CycleRow[]): number | null {
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, row) => sum + row.periodDays, 0);
  return Math.round(total / rows.length);
}

export function getMaxCycleDays(rows: CycleRow[]): number {
  return rows.reduce((max, row) => Math.max(max, row.cycleDays), 0);
}
