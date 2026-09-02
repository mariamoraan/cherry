import type { CycleLog, FlowLevel } from "@/core/storage/types";

import { addDays, diffDays } from "./dates";

export type PeriodRange = {
  start: string;
  end: string;
  dates: string[];
};

export function isPeriodFlow(flow: FlowLevel | null): boolean {
  return (
    flow === "SPOTTING" ||
    flow === "LIGHT" ||
    flow === "MEDIUM" ||
    flow === "HEAVY"
  );
}

function toRange(dates: string[]): PeriodRange {
  return {
    start: dates[0] ?? "",
    end: dates.at(-1) ?? "",
    dates,
  };
}

export function getPeriodRanges(logs: CycleLog[]): PeriodRange[] {
  const dates = logs
    .filter((log) => isPeriodFlow(log.flow))
    .map((log) => log.date)
    .sort();

  const ranges: PeriodRange[] = [];
  let current: string[] = [];

  for (const date of dates) {
    const last = current.at(-1);
    if (last && diffDays(last, date) === 1) {
      current.push(date);
    } else {
      if (current.length > 0) ranges.push(toRange(current));
      current = [date];
    }
  }

  if (current.length > 0) ranges.push(toRange(current));
  return ranges;
}

export function getPeriodDateSet(ranges: PeriodRange[]): Set<string> {
  return new Set(ranges.flatMap((range) => range.dates));
}

export function getPeriodDay(
  ranges: PeriodRange[],
  date: string,
): number | null {
  const range = ranges.find((item) => date >= item.start && date <= item.end);
  if (!range) return null;
  return diffDays(range.start, date) + 1;
}

export function isPeriodStart(date: string, periodDates: Set<string>): boolean {
  return periodDates.has(date) && !periodDates.has(addDays(date, -1));
}

export function isPeriodEnd(date: string, periodDates: Set<string>): boolean {
  return periodDates.has(date) && !periodDates.has(addDays(date, 1));
}

export function isVisualPeriodStart(
  date: string,
  periodDates: Set<string>,
  weekday: number,
): boolean {
  return (
    periodDates.has(date) &&
    (weekday === 0 || !periodDates.has(addDays(date, -1)))
  );
}

export function isVisualPeriodEnd(
  date: string,
  periodDates: Set<string>,
  weekday: number,
): boolean {
  return (
    periodDates.has(date) &&
    (weekday === 6 || !periodDates.has(addDays(date, 1)))
  );
}
