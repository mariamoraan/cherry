"use client";

import { useMemo } from "react";

import { useCycleLogs } from "@/core/storage/use-cycle-logs";

import { getQueryRange } from "./calendar";
import {
  getAverageCycleLength,
  getAveragePeriodDays,
  getCycleDay,
  getCycleRows,
  getMaxCycleDays,
} from "./cycle-stats";
import { toLocalDateKey } from "./dates";
import { getPeriodDateSet, getPeriodDay, getPeriodRanges } from "./period-ranges";
import {
  getAveragePeriodLength,
  getNextPeriodPrediction,
  getPredictedDateSet,
  shouldShowNextPeriodNotice,
} from "./prediction";

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
  const todayPeriodDay = useMemo(
    () => getPeriodDay(ranges, today),
    [ranges, today],
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
  const averagePeriodLength = useMemo(() => {
    const fromRows = getAveragePeriodDays(cycleRows);
    return fromRows ?? getAveragePeriodLength(ranges);
  }, [cycleRows, ranges]);
  const maxCycleDays = useMemo(() => getMaxCycleDays(cycleRows), [cycleRows]);
  const prediction = useMemo(
    () =>
      getNextPeriodPrediction(
        ranges,
        today,
        averageCycleLength,
        averagePeriodLength,
      ),
    [ranges, today, averageCycleLength, averagePeriodLength],
  );
  const predictedDates = useMemo(
    () => getPredictedDateSet(prediction),
    [prediction],
  );
  const showNextPeriodNotice = shouldShowNextPeriodNotice(prediction, periodDay);
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
    todayPeriodDay,
    cycleDay,
    cycleRows,
    averageCycleLength,
    averagePeriodLength,
    maxCycleDays,
    prediction,
    predictedDates,
    showNextPeriodNotice,
    selectedLog,
  };
}
