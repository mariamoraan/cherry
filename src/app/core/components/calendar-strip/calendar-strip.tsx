"use client";

import type { CalendarDay } from "@/core/cycle/calendar";
import { formatLongDate, WEEKDAY_LABELS } from "@/core/cycle/dates";
import { cx } from "@/core/lib/cx";

import styles from "./calendar-strip.module.scss";

type CalendarStripProps = {
  days: CalendarDay[];
  onSelectDate: (date: string) => void;
};

export function CalendarStrip({ days, onSelectDate }: CalendarStripProps) {
  return (
    <div className={styles.calendarStrip}>
      {days.map((day) => (
        <span
          key={`label-${day.date}`}
          className={styles.calendarStrip__label}
          aria-hidden="true"
        >
          {WEEKDAY_LABELS[day.weekday]}
        </span>
      ))}
      {days.map((day) => (
          <button
            key={day.date}
            type="button"
            aria-label={formatLongDate(day.date)}
            aria-pressed={day.isSelected}
            className={dayClassName(day)}
            onClick={() => onSelectDate(day.date)}
          >
          <span className={styles.calendarStrip__num}>{day.day}</span>
        </button>
      ))}
    </div>
  );
}

function dayClassName(day: CalendarDay): string {
  return cx(
    styles.calendarStrip__day,
    day.isPeriod && styles["calendarStrip__day--period"],
    day.isVisualStart && styles["calendarStrip__day--visualStart"],
    day.isVisualEnd && styles["calendarStrip__day--visualEnd"],
    day.isToday && styles["calendarStrip__day--today"],
    day.isSelected && styles["calendarStrip__day--selected"],
  );
}
