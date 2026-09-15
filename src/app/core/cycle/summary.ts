import type { FlowLevel } from "@/core/storage/types";

import {
  getAverageCycleLength,
  getAveragePeriodDays,
  getCycleRows,
} from "./cycle-stats";
import { getPeriodRanges, type PeriodRange } from "./period-ranges";
import { getAveragePeriodLength } from "./prediction";

export type CycleSummary = {
  ranges: PeriodRange[];
  averageCycleLength: number | null;
  averagePeriodLength: number | null;
};

export function buildCycleSummary(
  logs: Array<{ date: string; flow: FlowLevel | null }>,
  today: string,
): CycleSummary {
  const ranges = getPeriodRanges(logs);
  const cycleRows = getCycleRows(ranges, today);
  const averageCycleLength = getAverageCycleLength(cycleRows);
  const averagePeriodLength =
    getAveragePeriodDays(cycleRows) ?? getAveragePeriodLength(ranges);

  return {
    ranges,
    averageCycleLength,
    averagePeriodLength,
  };
}
