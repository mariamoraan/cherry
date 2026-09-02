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
): CalendarDay {
  const { day, month: dateMonth } = splitDateKey(date);
  const weekday = weekdayMondayFirst(date);

  return {
    date,
    day,
    inMonth: dateMonth === month,
    weekday,
    isToday: date === today,
    isSelected: date === selectedDate,
    isPeriod: periodDates.has(date),
    isPeriodStart: isPeriodStart(date, periodDates),
    isPeriodEnd: isPeriodEnd(date, periodDates),
    isVisualStart: isVisualPeriodStart(date, periodDates, weekday),
    isVisualEnd: isVisualPeriodEnd(date, periodDates, weekday),
  };
}

export function getQueryRange(today: string): { from: string; to: string } {
  const origin = startOfMonth(today);
  return {
    from: addMonths(origin, -12),
    to: addDays(addMonths(origin, 3), -1),
  };
}
