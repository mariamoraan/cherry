"use client";

import { useLayoutEffect, useRef } from "react";

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

const IGNORE_FALLBACK_MS = 120;

export function CalendarStrip({
  weeks,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: CalendarStripProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const ignoreScrollRef = useRef(false);
  const ignoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPrevWeekRef = useRef(onPrevWeek);
  const onNextWeekRef = useRef(onNextWeek);
  onPrevWeekRef.current = onPrevWeek;
  onNextWeekRef.current = onNextWeek;
  const middleKey = weeks[1]?.key;

  function beginIgnore() {
    ignoreScrollRef.current = true;
    if (ignoreTimeoutRef.current) clearTimeout(ignoreTimeoutRef.current);
    ignoreTimeoutRef.current = setTimeout(() => {
      ignoreScrollRef.current = false;
      ignoreTimeoutRef.current = null;
    }, IGNORE_FALLBACK_MS);
  }

  function endIgnore() {
    ignoreScrollRef.current = false;
    if (ignoreTimeoutRef.current) {
      clearTimeout(ignoreTimeoutRef.current);
      ignoreTimeoutRef.current = null;
    }
  }

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !middleKey) return;

    beginIgnore();
    scroller.scrollLeft = scroller.clientWidth;

    const handleScrollEnd = () => {
      if (ignoreScrollRef.current) {
        endIgnore();
        return;
      }

      const width = scroller.clientWidth;
      if (width <= 0) return;

      const index = Math.round(scroller.scrollLeft / width);
      if (index === 0) {
        beginIgnore();
        onPrevWeekRef.current();
      } else if (index === 2) {
        beginIgnore();
        onNextWeekRef.current();
      }
    };

    const handleScrollFallback = () => {
      if (ignoreScrollRef.current) return;
      // Browsers without scrollend: act when resting near a snap edge.
      const width = scroller.clientWidth;
      if (width <= 0) return;
      const progress = scroller.scrollLeft / width;
      if (progress < 0.05) {
        beginIgnore();
        onPrevWeekRef.current();
      } else if (progress > 1.95) {
        beginIgnore();
        onNextWeekRef.current();
      }
    };

    const supportsScrollEnd =
      typeof window !== "undefined" && "onscrollend" in window;

    if (supportsScrollEnd) {
      scroller.addEventListener("scrollend", handleScrollEnd);
    } else {
      scroller.addEventListener("scroll", handleScrollFallback, { passive: true });
    }

    return () => {
      if (supportsScrollEnd) {
        scroller.removeEventListener("scrollend", handleScrollEnd);
      } else {
        scroller.removeEventListener("scroll", handleScrollFallback);
      }
      if (ignoreTimeoutRef.current) {
        clearTimeout(ignoreTimeoutRef.current);
        ignoreTimeoutRef.current = null;
      }
    };
  }, [middleKey]);

  function handlePrev() {
    beginIgnore();
    onPrevWeek();
  }

  function handleNext() {
    beginIgnore();
    onNextWeek();
  }

  return (
    <div className={styles.calendarStrip}>
      <button
        type="button"
        className={styles.calendarStrip__nav}
        onClick={handlePrev}
        aria-label="Semana anterior"
      >
        <ChevronLeftIcon />
      </button>

      <div ref={scrollerRef} className={styles.calendarStrip__scroller}>
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
        onClick={handleNext}
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
