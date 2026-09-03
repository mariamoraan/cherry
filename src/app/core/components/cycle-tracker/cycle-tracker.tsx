"use client";

import { useCallback, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";

import { AppShell, type TrackerPane } from "@/core/components/app-shell/app-shell";
import { BottomNav } from "@/core/components/bottom-nav/bottom-nav";
import {
  CalendarScroll,
  type CalendarScrollHandle,
} from "@/core/components/calendar-scroll/calendar-scroll";
import { CalendarMonth } from "@/core/components/calendar-month/calendar-month";
import { CalendarStrip } from "@/core/components/calendar-strip/calendar-strip";
import { InsightsView } from "@/core/components/insights-view/insights-view";
import { LogDayPanel } from "@/core/components/log-day-panel/log-day-panel";
import { NextPeriodNotice } from "@/core/components/next-period-notice/next-period-notice";
import { TodayHero } from "@/core/components/today-hero/today-hero";
import { useTracker } from "@/core/components/tracker/tracker-provider";
import { UserMenu } from "@/core/components/user-menu/user-menu";
import { decorateDay, getWeekDays } from "@/core/cycle/calendar";
import {
  addDays,
  formatHeaderDate,
  splitDateKey,
  startOfMonth,
  startOfWeek,
} from "@/core/cycle/dates";
import { getFirstName } from "@/core/cycle/labels";

import styles from "./cycle-tracker.module.scss";

function paneFromPath(pathname: string): TrackerPane {
  if (pathname.startsWith("/insights")) return "insights";
  if (pathname.startsWith("/calendar")) return "calendar";
  return "today";
}

function buildWeekDays(
  selectedDate: string,
  today: string,
  periodDates: Set<string>,
  predictedDates: Set<string>,
  weekOffset: number,
) {
  const anchor = addDays(selectedDate, weekOffset * 7);
  return getWeekDays(anchor).map((date) => {
    const { month } = splitDateKey(date);
    return decorateDay(
      date,
      month,
      today,
      selectedDate,
      periodDates,
      predictedDates,
    );
  });
}

export function CycleTracker() {
  const pane = paneFromPath(usePathname());
  const tracker = useTracker();
  const calendarScrollRef = useRef<CalendarScrollHandle | null>(null);

  const weeks = useMemo(
    () =>
      [-1, 0, 1].map((offset) => {
        const days = buildWeekDays(
          tracker.selectedDate,
          tracker.today,
          tracker.periodDates,
          tracker.predictedDates,
          offset,
        );
        return {
          key: startOfWeek(addDays(tracker.selectedDate, offset * 7)),
          days,
        };
      }),
    [
      tracker.selectedDate,
      tracker.today,
      tracker.periodDates,
      tracker.predictedDates,
    ],
  );

  const handleJumpToToday = useCallback(() => {
    tracker.goToToday();
    if (pane === "calendar") {
      requestAnimationFrame(() => {
        calendarScrollRef.current?.scrollToMonth(startOfMonth(tracker.today));
      });
    }
  }, [pane, tracker]);

  const showJumpToToday =
    pane !== "insights" &&
    (tracker.selectedDate !== tracker.today ||
      (pane === "calendar" &&
        tracker.visibleMonth !== startOfMonth(tracker.today)));

  return (
    <AppShell
      pane={pane}
      formattedDate={formatHeaderDate(tracker.selectedDate, tracker.today)}
      headerAction={<UserMenu user={tracker.user} />}
      showJumpToToday={showJumpToToday}
      onJumpToToday={handleJumpToToday}
      today={
        <div className={styles.cycleTracker__today}>
          <CalendarStrip
            weeks={weeks}
            onSelectDate={tracker.selectDate}
            onPrevWeek={() => tracker.shiftWeek(-1)}
            onNextWeek={() => tracker.shiftWeek(1)}
          />
          <TodayHero
            firstName={getFirstName(tracker.user?.name)}
            periodDay={tracker.periodDay}
            cycleDay={tracker.cycleDay}
            selectedDate={tracker.selectedDate}
            today={tracker.today}
          />
          {tracker.showNextPeriodNotice && tracker.prediction && (
            <NextPeriodNotice prediction={tracker.prediction} />
          )}
          {tracker.isLoading ? (
            <p className={styles.cycleTracker__status}>Cargando registros…</p>
          ) : (
            <LogDayPanel
              key={tracker.selectedDate}
              date={tracker.selectedDate}
              log={tracker.selectedLog}
              isAuthenticated={tracker.isAuthenticated}
              isSaving={tracker.isSaving}
              onSave={tracker.upsertLog}
              onDelete={tracker.deleteLog}
            />
          )}
        </div>
      }
      calendar={
        <CalendarScroll
          today={tracker.today}
          selectedDate={tracker.selectedDate}
          periodDates={tracker.periodDates}
          predictedDates={tracker.predictedDates}
          onSelectDate={tracker.selectDate}
          onVisibleMonthChange={tracker.setVisibleMonth}
          scrollRef={calendarScrollRef}
        />
      }
      datePicker={
        <CalendarMonth
          monthKey={tracker.pickerMonth}
          today={tracker.today}
          selectedDate={tracker.selectedDate}
          periodDates={tracker.periodDates}
          predictedDates={tracker.predictedDates}
          onSelectDate={tracker.selectDate}
          onPrevMonth={tracker.showPrevMonth}
          onNextMonth={tracker.showNextMonth}
        />
      }
      insights={
        <InsightsView
          rows={tracker.cycleRows}
          averageCycleLength={tracker.averageCycleLength}
          averagePeriodLength={tracker.averagePeriodLength}
          maxCycleDays={tracker.maxCycleDays}
          prediction={tracker.prediction}
          periodDay={tracker.todayPeriodDay}
          isLoading={tracker.isLoading}
        />
      }
      nav={<BottomNav pane={pane} />}
    />
  );
}
