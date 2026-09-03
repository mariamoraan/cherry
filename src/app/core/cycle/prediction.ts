import { addDays, diffDays, fromDateKey } from "./dates";
import type { PeriodRange } from "./period-ranges";

export type PeriodPrediction = {
  start: string;
  end: string;
  dates: string[];
  daysUntil: number;
  cycleLengthUsed: number;
  periodLengthUsed: number;
  isEstimate: boolean;
};

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

export function getAveragePeriodLength(ranges: PeriodRange[]): number | null {
  if (ranges.length === 0) return null;
  const total = ranges.reduce((sum, range) => sum + range.dates.length, 0);
  return Math.round(total / ranges.length);
}

export function getNextPeriodPrediction(
  ranges: PeriodRange[],
  today: string,
  averageCycleLength: number | null,
  averagePeriodLength: number | null,
): PeriodPrediction | null {
  const last = ranges.at(-1);
  if (!last) return null;

  const isEstimate = averageCycleLength == null;
  const cycleLengthUsed = averageCycleLength ?? DEFAULT_CYCLE_LENGTH;
  const periodLengthUsed = averagePeriodLength ?? DEFAULT_PERIOD_LENGTH;
  const start = addDays(last.start, cycleLengthUsed);
  const end = addDays(start, Math.max(periodLengthUsed, 1) - 1);
  const dates = Array.from({ length: Math.max(periodLengthUsed, 1) }, (_, index) =>
    addDays(start, index),
  );

  return {
    start,
    end,
    dates,
    daysUntil: diffDays(today, start),
    cycleLengthUsed,
    periodLengthUsed,
    isEstimate,
  };
}

export function getPredictedDateSet(prediction: PeriodPrediction | null): Set<string> {
  return new Set(prediction?.dates ?? []);
}

export function shouldShowNextPeriodNotice(
  prediction: PeriodPrediction | null,
  periodDay: number | null,
): boolean {
  return prediction != null && periodDay == null;
}

function formatDayMonth(dateKey: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
  }).format(fromDateKey(dateKey));
}

export function formatNextPeriodNotice(prediction: PeriodPrediction): string {
  const { daysUntil, start } = prediction;
  const dayMonth = formatDayMonth(start);

  if (daysUntil === 0) return "Tu regla llega hoy";
  if (daysUntil === 1) return "Tu regla llega mañana";
  if (daysUntil > 1 && daysUntil <= 7) {
    return `Tu regla llega en ${daysUntil} días`;
  }
  if (daysUntil > 7) return `Próxima regla el ${dayMonth}`;
  return `Suele llegar alrededor del ${dayMonth}. Llevas ${Math.abs(daysUntil)} días de retraso.`;
}

export function formatInsightsPredictionHeadline(
  prediction: PeriodPrediction | null,
  periodDay: number | null,
): { title: string; subtitle: string } {
  if (periodDay != null) {
    return {
      title: `Día ${periodDay} del periodo`,
      subtitle: "Estás en tu sangrado actual.",
    };
  }

  if (!prediction) {
    return {
      title: "Empieza a registrar",
      subtitle: "Con un par de ciclos verás tu ritmo aquí.",
    };
  }

  const { daysUntil, start } = prediction;
  const dayMonth = formatDayMonth(start);

  if (daysUntil === 0) {
    return { title: "Hoy", subtitle: "Tu regla llega hoy." };
  }
  if (daysUntil === 1) {
    return { title: "Mañana", subtitle: "Tu regla llega mañana." };
  }
  if (daysUntil > 1 && daysUntil <= 7) {
    return {
      title: `En ${daysUntil} días`,
      subtitle: `Próxima regla el ${dayMonth}.`,
    };
  }
  if (daysUntil > 7) {
    return {
      title: dayMonth.charAt(0).toUpperCase() + dayMonth.slice(1),
      subtitle: `En ${daysUntil} días, según tu media.`,
    };
  }
  return {
    title: `${Math.abs(daysUntil)} días de retraso`,
    subtitle: `Suele llegar alrededor del ${dayMonth}.`,
  };
}
