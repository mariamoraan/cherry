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
  active: boolean;
  scrollRef?: Ref<CalendarScrollHandle | null>;
};

const INITIAL_BACK = 2;
const INITIAL_FORWARD = 2;
const EXTEND_BY = 2;
/** Prefetch when sentinel is within this distance of the viewport. */
const SENTINEL_ROOT_MARGIN = "280px 0px";

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
  active,
  scrollRef,
}: CalendarScrollProps) {
  const todayMonth = startOfMonth(today);
  const [back, setBack] = useState(INITIAL_BACK);
  const [forward, setForward] = useState(INITIAL_FORWARD);
  const [ready, setReady] = useState(false);
  const monthKeys = useMemo(
    () => buildMonthKeys(todayMonth, back, forward),
    [todayMonth, back, forward],
  );
  const monthRefs = useRef(new Map<string, HTMLElement>());
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const extendingRef = useRef<"back" | "forward" | null>(null);
  const prevBackRef = useRef(back);
  const onVisibleMonthChangeRef = useRef(onVisibleMonthChange);
  onVisibleMonthChangeRef.current = onVisibleMonthChange;

  useImperativeHandle(scrollRef, () => ({
    scrollToMonth: (monthKey: string) => {
      const node = monthRefs.current.get(startOfMonth(monthKey));
      node?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  }));

  useEffect(() => {
    if (active) return;
    extendingRef.current = null;
    setReady(false);
    setBack(INITIAL_BACK);
    setForward(INITIAL_FORWARD);
    prevBackRef.current = INITIAL_BACK;
  }, [active]);

  useLayoutEffect(() => {
    if (!active) return;
    const node = monthRefs.current.get(todayMonth);
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const nearViewport =
      rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.2;
    if (!nearViewport) {
      node.scrollIntoView({ block: "start" });
    }

    extendingRef.current = null;
    setReady(false);
    const timer = window.setTimeout(() => {
      setReady(true);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [active, todayMonth]);

  useLayoutEffect(() => {
    if (back <= prevBackRef.current) {
      prevBackRef.current = back;
      return;
    }

    const added = back - prevBackRef.current;
    prevBackRef.current = back;

    let delta = 0;
    for (let index = 0; index < added; index += 1) {
      const node = monthRefs.current.get(monthKeys[index] ?? "");
      if (node) delta += node.offsetHeight;
    }

    const anchor = monthRefs.current.get(monthKeys[added] ?? "");
    const parent = anchor?.parentElement;
    if (parent && added > 0) {
      const gap =
        Number.parseFloat(window.getComputedStyle(parent).rowGap || "0") ||
        Number.parseFloat(window.getComputedStyle(parent).gap || "0") ||
        0;
      delta += gap * added;
    }

    if (delta > 0) {
      window.scrollBy(0, delta);
    }
  }, [back, monthKeys]);

  useEffect(() => {
    if (!active) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const monthKey = visible?.target.getAttribute("data-month");
        if (monthKey) onVisibleMonthChangeRef.current(monthKey);
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
  }, [active, monthKeys]);

  useEffect(() => {
    if (!active || !ready) return;

    const top = topSentinelRef.current;
    const bottom = bottomSentinelRef.current;
    if (!top || !bottom) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          if (entry.target === top && extendingRef.current !== "back") {
            extendingRef.current = "back";
            setBack((value) => value + EXTEND_BY);
          } else if (
            entry.target === bottom &&
            extendingRef.current !== "forward"
          ) {
            extendingRef.current = "forward";
            setForward((value) => value + EXTEND_BY);
          }
        }
      },
      {
        root: null,
        rootMargin: SENTINEL_ROOT_MARGIN,
        threshold: 0,
      },
    );

    observer.observe(top);
    observer.observe(bottom);

    return () => observer.disconnect();
  }, [active, ready, monthKeys]);

  // After months render, release the extend lock so a still-visible sentinel
  // can fire again when the observer reconnects on the next monthKeys change.
  useLayoutEffect(() => {
    if (!active) return;
    extendingRef.current = null;
  }, [active, monthKeys]);

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

      <div className={styles.calendarScroll__months}>
        <div
          ref={topSentinelRef}
          className={styles.calendarScroll__sentinel}
          aria-hidden="true"
        />

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

        <div
          ref={bottomSentinelRef}
          className={styles.calendarScroll__sentinel}
          aria-hidden="true"
        />
      </div>
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
