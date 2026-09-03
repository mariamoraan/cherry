"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useSession } from "next-auth/react";

import { addDays, addMonths, startOfMonth, toLocalDateKey } from "@/core/cycle/dates";
import { useCycleView } from "@/core/cycle/use-cycle-view";

type CycleView = ReturnType<typeof useCycleView>;

type TrackerContextValue = CycleView & {
  selectedDate: string;
  visibleMonth: string;
  pickerMonth: string;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  selectDate: (date: string) => void;
  goToToday: () => void;
  shiftWeek: (weeks: number) => void;
  setVisibleMonth: (monthKey: string) => void;
  showPrevMonth: () => void;
  showNextMonth: () => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState(toLocalDateKey);
  const [visibleMonth, setVisibleMonthState] = useState(() =>
    startOfMonth(toLocalDateKey()),
  );
  const [pickerMonth, setPickerMonth] = useState(() =>
    startOfMonth(toLocalDateKey()),
  );
  const view = useCycleView(selectedDate);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
    const month = startOfMonth(date);
    setVisibleMonthState(month);
    setPickerMonth(month);
  }, []);

  const goToToday = useCallback(() => {
    selectDate(view.today);
  }, [selectDate, view.today]);

  const shiftWeek = useCallback((weeks: number) => {
    setSelectedDate((date) => {
      const next = addDays(date, weeks * 7);
      const month = startOfMonth(next);
      setVisibleMonthState(month);
      setPickerMonth(month);
      return next;
    });
  }, []);

  const setVisibleMonth = useCallback((monthKey: string) => {
    setVisibleMonthState(startOfMonth(monthKey));
  }, []);

  const showPrevMonth = useCallback(() => {
    setPickerMonth((month) => startOfMonth(addMonths(month, -1)));
  }, []);

  const showNextMonth = useCallback(() => {
    setPickerMonth((month) => startOfMonth(addMonths(month, 1)));
  }, []);

  const value = useMemo<TrackerContextValue>(
    () => ({
      ...view,
      selectedDate,
      visibleMonth,
      pickerMonth,
      user: session?.user ?? null,
      selectDate,
      goToToday,
      shiftWeek,
      setVisibleMonth,
      showPrevMonth,
      showNextMonth,
    }),
    [
      view,
      selectedDate,
      visibleMonth,
      pickerMonth,
      session?.user,
      selectDate,
      goToToday,
      shiftWeek,
      setVisibleMonth,
      showPrevMonth,
      showNextMonth,
    ],
  );

  return (
    <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
  );
}

export function useTracker(): TrackerContextValue {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error("useTracker must be used within TrackerProvider");
  }
  return context;
}
