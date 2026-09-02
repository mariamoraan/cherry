"use client";

import { useMemo } from "react";

import { useCycleLogs } from "@/core/storage/use-cycle-logs";

import { getQueryRange } from "./calendar";
import {
  getAverageCycleLength,
  getCycleDay,
  getCycleRows,
  getMaxCycleDays,
} from "./cycle-stats";
import { toLocalDateKey } from "./dates";
import { getPeriodDateSet, getPeriodDay, getPeriodRanges } from "./period-ranges";

export function useCycleView(selectedDate: string) {
  const today = useMemo(() => toLocalDateKey(), []);
  const { from, to } = useMemo(() => getQueryRange(today), [today]);
  const cycleLogs = useCycleLogs(from, to);

  const ranges = useMemo(
    () => getPeriodRanges(cycleLogs.logs),
    [cycleLogs.logs],
  );
  const periodDates = useMemo(() => getPeriodDateSet(ranges), [ranges]);
  const periodDay = useMemo(
    () => getPeriodDay(ranges, selectedDate),
    [ranges, selectedDate],
  );
  const cycleDay = useMemo(
    () => getCycleDay(ranges, selectedDate),
    [ranges, selectedDate],
  );
  const cycleRows = useMemo(
    () => getCycleRows(ranges, today),
    [ranges, today],
  );
  const averageCycleLength = useMemo(
    () => getAverageCycleLength(cycleRows),
    [cycleRows],
  );
  const maxCycleDays = useMemo(() => getMaxCycleDays(cycleRows), [cycleRows]);
  const selectedLog = useMemo(
    () => cycleLogs.logs.find((log) => log.date === selectedDate) ?? null,
    [cycleLogs.logs, selectedDate],
  );

  return {
    ...cycleLogs,
    today,
    ranges,
    periodDates,
    periodDay,
    cycleDay,
    cycleRows,
    averageCycleLength,
    maxCycleDays,
    selectedLog,
  };
}
