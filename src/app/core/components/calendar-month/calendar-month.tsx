"use client";

import {
  decorateDay,
  getMonthGrid,
  type CalendarDay,
} from "@/core/cycle/calendar";
import {
  formatLongDate,
  formatMonthYear,
  splitDateKey,
  WEEKDAY_LABELS,
} from "@/core/cycle/dates";
import { cx } from "@/core/lib/cx";

import styles from "./calendar-month.module.scss";
import { ChevronLeftIcon, ChevronRightIcon } from "../../icons";

type CalendarMonthProps = {
  monthKey: string;
  today: string;
  selectedDate: string;
  periodDates: Set<string>;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  variant?: "default" | "sm";
};

export function CalendarMonth({
  monthKey,
  today,
  selectedDate,
  periodDates,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  variant = "default",
}: CalendarMonthProps) {
  const { year, month } = splitDateKey(monthKey);
  const days = getMonthGrid(year, month).map((date) =>
    decorateDay(date, month, today, selectedDate, periodDates),
  );

  return (
    <section
      className={cx(
        styles.calendarMonth,
        variant === "sm" && styles["calendarMonth--sm"],
      )}
    >
      <div className={styles.calendarMonth__header}>
        <button
          type="button"
          className={styles.calendarMonth__nav}
          onClick={onPrevMonth}
          aria-label="Mes anterior"
        >
          <ChevronLeftIcon />
        </button>
        <h1 className={styles.calendarMonth__title}>{formatMonthYear(monthKey)}</h1>
        <button
          type="button"
          className={styles.calendarMonth__nav}
          onClick={onNextMonth}
          aria-label="Mes siguiente"
        >
          <ChevronRightIcon />
        </button>
      </div>
      <div className={styles.calendarMonth__weekdays}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className={styles.calendarMonth__grid}>
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            className={dayClassName(day)}
            onClick={() => onSelectDate(day.date)}
            aria-label={formatLongDate(day.date)}
            aria-current={day.isToday ? "date" : undefined}
            aria-pressed={day.isSelected}
          >
            <span className={styles.calendarMonth__num}>{day.day}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function dayClassName(day: CalendarDay): string {
  return cx(
    styles.calendarMonth__day,
    !day.inMonth && styles["calendarMonth__day--outside"],
    day.isPeriod && styles["calendarMonth__day--period"],
    day.isVisualStart && styles["calendarMonth__day--visualStart"],
    day.isVisualEnd && styles["calendarMonth__day--visualEnd"],
    day.isToday && styles["calendarMonth__day--today"],
    day.isSelected && styles["calendarMonth__day--selected"],
  );
}