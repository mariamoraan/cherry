"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";

import {
  decorateDay,
  getMonthGrid,
  type CalendarDay,
} from "@/core/cycle/calendar";
import {
  addMonths,
  formatLongDate,
  formatMonthYear,
  splitDateKey,
  startOfMonth,
  WEEKDAY_LABELS,
} from "@/core/cycle/dates";
import { cx } from "@/core/lib/cx";

import styles from "./calendar-scroll.module.scss";

export type CalendarScrollHandle = {
  scrollToMonth: (monthKey: string) => void;
};

type CalendarScrollProps = {
  today: string;
  selectedDate: string;
  periodDates: Set<string>;
  predictedDates: Set<string>;
  onSelectDate: (date: string) => void;
  onVisibleMonthChange: (monthKey: string) => void;
  scrollRef?: Ref<CalendarScrollHandle | null>;
};

const INITIAL_BACK = 12;
const INITIAL_FORWARD = 8;
const EXTEND_BY = 4;

function buildMonthKeys(center: string, back: number, forward: number): string[] {
  const origin = startOfMonth(center);
  return Array.from({ length: back + forward + 1 }, (_, index) =>
    startOfMonth(addMonths(origin, index - back)),
  );
}

export function CalendarScroll({
  today,
  selectedDate,
  periodDates,
  predictedDates,
  onSelectDate,
  onVisibleMonthChange,
  scrollRef,
}: CalendarScrollProps) {
  const todayMonth = startOfMonth(today);
  const [back, setBack] = useState(INITIAL_BACK);
  const [forward, setForward] = useState(INITIAL_FORWARD);
  const monthKeys = useMemo(
    () => buildMonthKeys(todayMonth, back, forward),
    [todayMonth, back, forward],
  );
  const monthRefs = useRef(new Map<string, HTMLElement>());
  const sentinelStartRef = useRef<HTMLDivElement | null>(null);
  const sentinelEndRef = useRef<HTMLDivElement | null>(null);
  const didInitialScroll = useRef(false);
  const prevBackRef = useRef(back);

  useImperativeHandle(scrollRef, () => ({
    scrollToMonth: (monthKey: string) => {
      const node = monthRefs.current.get(startOfMonth(monthKey));
      node?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  }));

  useEffect(() => {
    if (didInitialScroll.current) return;
    const node = monthRefs.current.get(todayMonth);
    if (!node) return;
    node.scrollIntoView({ block: "start" });
    didInitialScroll.current = true;
  }, [todayMonth, monthKeys]);

  useLayoutEffect(() => {
    if (back <= prevBackRef.current) {
      prevBackRef.current = back;
      return;
    }
    const added = back - prevBackRef.current;
    prevBackRef.current = back;
    const firstNew = monthKeys[0];
    const anchor = monthKeys[added];
    if (!firstNew || !anchor) return;
    const node = monthRefs.current.get(anchor);
    if (node) {
      node.scrollIntoView({ block: "start" });
    }
  }, [back, monthKeys]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const monthKey = visible?.target.getAttribute("data-month");
        if (monthKey) onVisibleMonthChange(monthKey);
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.35, 0.6],
      },
    );

    for (const node of monthRefs.current.values()) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [monthKeys, onVisibleMonthChange]);

  useEffect(() => {
    const start = sentinelStartRef.current;
    const end = sentinelEndRef.current;
    if (!start || !end) return;

    let locked = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (locked) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          locked = true;
          if (entry.target === start) {
            setBack((value) => value + EXTEND_BY);
          } else if (entry.target === end) {
            setForward((value) => value + EXTEND_BY);
          }
          break;
        }
      },
      { rootMargin: "320px 0px", threshold: 0 },
    );

    observer.observe(start);
    observer.observe(end);
    return () => observer.disconnect();
  }, [monthKeys]);

  const setMonthRef = useCallback((monthKey: string, node: HTMLElement | null) => {
    if (node) monthRefs.current.set(monthKey, node);
    else monthRefs.current.delete(monthKey);
  }, []);

  return (
    <div className={styles.calendarScroll}>
      <div className={styles.calendarScroll__weekdays} aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div ref={sentinelStartRef} className={styles.calendarScroll__sentinel} />

      <div className={styles.calendarScroll__months}>
        {monthKeys.map((monthKey) => {
          const { year, month } = splitDateKey(monthKey);
          const days = getMonthGrid(year, month).map((date) =>
            decorateDay(
              date,
              month,
              today,
              selectedDate,
              periodDates,
              predictedDates,
            ),
          );

          return (
            <section
              key={monthKey}
              data-month={monthKey}
              ref={(node) => setMonthRef(monthKey, node)}
              className={styles.calendarScroll__month}
              aria-label={formatMonthYear(monthKey)}
            >
              <h2 className={styles.calendarScroll__title}>
                {formatMonthYear(monthKey)}
              </h2>
              <div className={styles.calendarScroll__grid}>
                {days.map((day) =>
                  day.inMonth ? (
                    <button
                      key={day.date}
                      type="button"
                      className={dayClassName(day)}
                      onClick={() => onSelectDate(day.date)}
                      aria-label={formatLongDate(day.date)}
                      aria-current={day.isToday ? "date" : undefined}
                      aria-pressed={day.isSelected}
                    >
                      <span className={styles.calendarScroll__num}>{day.day}</span>
                    </button>
                  ) : (
                    <span
                      key={`${monthKey}-${day.date}`}
                      className={styles.calendarScroll__empty}
                      aria-hidden="true"
                    />
                  ),
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div ref={sentinelEndRef} className={styles.calendarScroll__sentinel} />
    </div>
  );
}

function dayClassName(day: CalendarDay): string {
  return cx(
    styles.calendarScroll__day,
    day.isPeriod && styles["calendarScroll__day--period"],
    day.isPredicted && styles["calendarScroll__day--predicted"],
    day.isVisualStart && styles["calendarScroll__day--visualStart"],
    day.isVisualEnd && styles["calendarScroll__day--visualEnd"],
    day.isToday && styles["calendarScroll__day--today"],
    day.isSelected && styles["calendarScroll__day--selected"],
  );
}
