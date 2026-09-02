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

import { addMonths, startOfMonth, toLocalDateKey } from "@/core/cycle/dates";
import { useCycleView } from "@/core/cycle/use-cycle-view";

type CycleView = ReturnType<typeof useCycleView>;

type TrackerContextValue = CycleView & {
  selectedDate: string;
  visibleMonth: string;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  selectDate: (date: string) => void;
  showPrevMonth: () => void;
  showNextMonth: () => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState(toLocalDateKey);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(toLocalDateKey()),
  );
  const view = useCycleView(selectedDate);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setVisibleMonth(startOfMonth(date));
  }, []);

  const showPrevMonth = useCallback(() => {
    setVisibleMonth((month) => startOfMonth(addMonths(month, -1)));
  }, []);

  const showNextMonth = useCallback(() => {
    setVisibleMonth((month) => startOfMonth(addMonths(month, 1)));
  }, []);

  const value = useMemo<TrackerContextValue>(
    () => ({
      ...view,
      selectedDate,
      visibleMonth,
      user: session?.user ?? null,
      selectDate,
      showPrevMonth,
      showNextMonth,
    }),
    [
      view,
      selectedDate,
      visibleMonth,
      session?.user,
      selectDate,
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
