"use client";

import { useMemo } from "react";

import type { TrackerPane } from "@/core/components/app-shell/app-shell";
import { getWeekWindow } from "@/core/cycle/calendar";
import {
  getAveragePeriodDays,
  getCycleDay,
  getCycleRows,
  getMaxCycleDays,
} from "@/core/cycle/cycle-stats";
import { toLocalDateKey } from "@/core/cycle/dates";
import { getPeriodDateSet, getPeriodDay } from "@/core/cycle/period-ranges";
import {
  getNextPeriodPrediction,
  getPredictedDateSet,
  shouldShowNextPeriodNotice,
} from "@/core/cycle/prediction";
import { useCycleLogs, useCycleSummary } from "@/core/storage/use-cycle-logs";

export function useCycleView(selectedDate: string, pane: TrackerPane) {
  const today = useMemo(() => toLocalDateKey(), []);
  const { from, to } = useMemo(
    () => getWeekWindow(selectedDate),
    [selectedDate],
  );
  const summaryQuery = useCycleSummary(today);
  const needsWeekLogs = pane === "today";
  const cycleLogs = useCycleLogs(from, to, needsWeekLogs);

  const ranges = summaryQuery.summary?.ranges ?? [];
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
  const averageCycleLength =
    summaryQuery.summary?.averageCycleLength ?? null;
  const averagePeriodLength =
    summaryQuery.summary?.averagePeriodLength ??
    getAveragePeriodDays(cycleRows);
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

  const isLoading =
    summaryQuery.isLoading || (needsWeekLogs && cycleLogs.isLoading);

  return {
    ...cycleLogs,
    isLoading,
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
