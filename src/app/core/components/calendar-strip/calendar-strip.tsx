"use client";

import { useEffect, useRef } from "react";

import type { CalendarDay } from "@/core/cycle/calendar";
import { formatLongDate, WEEKDAY_LABELS } from "@/core/cycle/dates";
import { ChevronLeftIcon, ChevronRightIcon } from "@/core/icons";
import { cx } from "@/core/lib/cx";

import styles from "./calendar-strip.module.scss";

type WeekSlide = {
  key: string;
  days: CalendarDay[];
};

type CalendarStripProps = {
  weeks: WeekSlide[];
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

export function CalendarStrip({
  weeks,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: CalendarStripProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const ignoreScrollRef = useRef(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    ignoreScrollRef.current = true;
    const middle = scroller.clientWidth;
    scroller.scrollLeft = middle;
    const frame = requestAnimationFrame(() => {
      ignoreScrollRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [weeks[1]?.key]);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || ignoreScrollRef.current) return;

    const width = scroller.clientWidth;
    if (width <= 0) return;

    const index = Math.round(scroller.scrollLeft / width);
    if (index === 0) {
      ignoreScrollRef.current = true;
      onPrevWeek();
    } else if (index === 2) {
      ignoreScrollRef.current = true;
      onNextWeek();
    }
  };

  return (
    <div className={styles.calendarStrip}>
      <button
        type="button"
        className={styles.calendarStrip__nav}
        onClick={onPrevWeek}
        aria-label="Semana anterior"
      >
        <ChevronLeftIcon />
      </button>

      <div
        ref={scrollerRef}
        className={styles.calendarStrip__scroller}
        onScroll={handleScroll}
      >
        {weeks.map((week) => (
          <div key={week.key} className={styles.calendarStrip__week}>
            {week.days.map((day) => (
              <span
                key={`label-${day.date}`}
                className={cx(
                  styles.calendarStrip__label,
                  day.isToday && styles["calendarStrip__label--today"],
                )}
                aria-hidden="true"
              >
                {WEEKDAY_LABELS[day.weekday]}
              </span>
            ))}
            {week.days.map((day) => (
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
        ))}
      </div>

      <button
        type="button"
        className={styles.calendarStrip__nav}
        onClick={onNextWeek}
        aria-label="Semana siguiente"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}

function dayClassName(day: CalendarDay): string {
  return cx(
    styles.calendarStrip__day,
    day.isPeriod && styles["calendarStrip__day--period"],
    day.isPredicted && styles["calendarStrip__day--predicted"],
    day.isVisualStart && styles["calendarStrip__day--visualStart"],
    day.isVisualEnd && styles["calendarStrip__day--visualEnd"],
    day.isToday && styles["calendarStrip__day--today"],
    day.isSelected && styles["calendarStrip__day--selected"],
  );
}
