"use client";

import { usePathname } from "next/navigation";

import { AppShell, type TrackerPane } from "@/core/components/app-shell/app-shell";
import { BottomNav } from "@/core/components/bottom-nav/bottom-nav";
import { CalendarMonth } from "@/core/components/calendar-month/calendar-month";
import { CalendarStrip } from "@/core/components/calendar-strip/calendar-strip";
import { CycleLengthChart } from "@/core/components/cycle-length-chart/cycle-length-chart";
import { LogDayPanel } from "@/core/components/log-day-panel/log-day-panel";
import { TodayHero } from "@/core/components/today-hero/today-hero";
import { useTracker } from "@/core/components/tracker/tracker-provider";
import { UserMenu } from "@/core/components/user-menu/user-menu";
import { decorateDay, getWeekDays } from "@/core/cycle/calendar";
import { formatLongDate, splitDateKey } from "@/core/cycle/dates";
import { getFirstName } from "@/core/cycle/labels";

import styles from "./cycle-tracker.module.scss";

function paneFromPath(pathname: string): TrackerPane {
  if (pathname.startsWith("/insights")) return "insights";
  if (pathname.startsWith("/calendar")) return "calendar";
  return "today";
}

export function CycleTracker() {
  const pane = paneFromPath(usePathname());
  const tracker = useTracker();
  const weekDays = getWeekDays(tracker.selectedDate).map((date) => {
    const { month } = splitDateKey(date);
    return decorateDay(
      date,
      month,
      tracker.today,
      tracker.selectedDate,
      tracker.periodDates,
    );
  });

  return (
    <AppShell
      pane={pane}
      formattedDate={formatLongDate(tracker.selectedDate)}
      headerAction={<UserMenu user={tracker.user} />}
      today={
        <div className={styles.cycleTracker__today}>
          <CalendarStrip days={weekDays} onSelectDate={tracker.selectDate} />
          <TodayHero
            firstName={getFirstName(tracker.user?.name)}
            periodDay={tracker.periodDay}
            cycleDay={tracker.cycleDay}
          />
          {tracker.isLoading && (
            <p className={styles.cycleTracker__status}>Cargando registros…</p>
          )}
          <LogDayPanel
            key={tracker.selectedDate}
            date={tracker.selectedDate}
            log={tracker.selectedLog}
            isAuthenticated={tracker.isAuthenticated}
            isSaving={tracker.isSaving}
            onSave={tracker.upsertLog}
            onDelete={tracker.deleteLog}
          />
        </div>
      }
      calendar={
        <CalendarMonth
          monthKey={tracker.visibleMonth}
          today={tracker.today}
          selectedDate={tracker.selectedDate}
          periodDates={tracker.periodDates}
          onSelectDate={tracker.selectDate}
          onPrevMonth={tracker.showPrevMonth}
          onNextMonth={tracker.showNextMonth}
        />
      }
      insights={
        <CycleLengthChart
          rows={tracker.cycleRows}
          averageCycleLength={tracker.averageCycleLength}
          maxCycleDays={tracker.maxCycleDays}
          isLoading={tracker.isLoading}
        />
      }
      nav={<BottomNav pane={pane} />}
    />
  );
}
