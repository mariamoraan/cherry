import {
  addDays,
  addMonths,
  padMonth,
  splitDateKey,
  startOfMonth,
  startOfWeek,
  weekdayMondayFirst,
} from "./dates";
import {
  isPeriodEnd,
  isPeriodStart,
  isVisualPeriodEnd,
  isVisualPeriodStart,
} from "./period-ranges";

export type CalendarDay = {
  date: string;
  day: number;
  inMonth: boolean;
  weekday: number;
  isToday: boolean;
  isSelected: boolean;
  isPeriod: boolean;
  isPredicted: boolean;
  isPeriodStart: boolean;
  isPeriodEnd: boolean;
  isVisualStart: boolean;
  isVisualEnd: boolean;
};

export function getWeekDays(selectedDate: string): string[] {
  const start = startOfWeek(selectedDate);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function getMonthGrid(year: number, month: number): string[] {
  const first = `${year}-${padMonth(month)}-01`;
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function decorateDay(
  date: string,
  month: number,
  today: string,
  selectedDate: string,
  periodDates: Set<string>,
  predictedDates: Set<string> = new Set(),
): CalendarDay {
  const { day, month: dateMonth } = splitDateKey(date);
  const weekday = weekdayMondayFirst(date);
  const isPeriod = periodDates.has(date);
  const isPredicted = !isPeriod && predictedDates.has(date);
  const bandDates = isPeriod ? periodDates : isPredicted ? predictedDates : periodDates;

  return {
    date,
    day,
    inMonth: dateMonth === month,
    weekday,
    isToday: date === today,
    isSelected: date === selectedDate,
    isPeriod,
    isPredicted,
    isPeriodStart: isPeriodStart(date, periodDates),
    isPeriodEnd: isPeriodEnd(date, periodDates),
    isVisualStart:
      (isPeriod || isPredicted) && isVisualPeriodStart(date, bandDates, weekday),
    isVisualEnd:
      (isPeriod || isPredicted) && isVisualPeriodEnd(date, bandDates, weekday),
  };
}

export function getWeekWindow(selectedDate: string): { from: string; to: string } {
  const weekStart = startOfWeek(selectedDate);
  return {
    from: addDays(weekStart, -7),
    to: addDays(weekStart, 20),
  };
}

export function getMonthBounds(monthKey: string): { from: string; to: string } {
  const from = startOfMonth(monthKey);
  return {
    from,
    to: addDays(addMonths(from, 1), -1),
  };
}
