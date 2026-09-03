"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import Link from "next/link";

import { cx } from "@/core/lib/cx";

import styles from "./app-shell.module.scss";

export type TrackerPane = "today" | "calendar" | "insights";

type AppShellProps = {
  pane: TrackerPane;
  formattedDate: string;
  headerAction: ReactNode;
  today: ReactNode;
  calendar: ReactNode;
  insights: ReactNode;
  nav: ReactNode;
};

const NAV_ITEMS: Array<{ pane: TrackerPane; href: string; label: string }> = [
  { pane: "today", href: "/dashboard", label: "Hoy" },
  { pane: "calendar", href: "/calendar", label: "Calendario" },
  { pane: "insights", href: "/insights", label: "Insights" },
];

export function AppShell({
  pane,
  formattedDate,
  headerAction,
  today,
  calendar,
  insights,
  nav,
}: AppShellProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const datePopoverAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isCalendarOpen) return;

    const handleDocumentPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (datePopoverAnchorRef.current?.contains(target)) return;
      setIsCalendarOpen(false);
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCalendarOpen(false);
    };

    document.addEventListener("mousedown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isCalendarOpen]);

  const calendarElement = isValidElement(calendar)
    ? (calendar as ReactElement<{
        onSelectDate?: (date: string) => void;
        variant?: "default" | "sm";
      }>)
    : null;

  const calendarForPopover = calendarElement?.props.onSelectDate
    ? cloneElement(calendarElement, {
        onSelectDate: (date: string) => {
          calendarElement.props.onSelectDate?.(date);
          setIsCalendarOpen(false);
        },
        variant: "sm",
      })
    : calendar;

  return (
    <div className={cx(styles.appShell, styles[`appShell--${pane}`])}>
      <header className={styles.appShell__header}>
        <div
          className={styles.appShell__datePopoverAnchor}
          ref={datePopoverAnchorRef}
        >
          <button
            type="button"
            className={styles.appShell__date}
            aria-haspopup="dialog"
            aria-expanded={isCalendarOpen}
            aria-controls="calendar-date-popover"
            onClick={() => setIsCalendarOpen((v) => !v)}
          >
            {formattedDate}
          </button>

          {isCalendarOpen && (
            <div
              className={styles.appShell__datePopover}
              id="calendar-date-popover"
              role="dialog"
              aria-label="Calendario"
            >
              <section className={styles.appShell__calendarPopoverCard}>
                {calendarForPopover}
              </section>
            </div>
          )}
        </div>
        <nav className={styles.appShell__nav} aria-label="Principal">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.pane}
              href={item.href}
              className={cx(
                styles.appShell__navItem,
                pane === item.pane && styles["appShell__navItem--active"],
              )}
              aria-current={pane === item.pane ? "page" : undefined}
            >
              <NavIcon pane={item.pane} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.appShell__headerAction}>{headerAction}</div>
      </header>

      <div className={cx(styles.appShell__main, styles[`appShell__main--${pane}`])}>
        <section className={styles.appShell__today} aria-label="Hoy">
          {today}
        </section>
        <section className={styles.appShell__calendar} aria-label="Calendario">
          {calendar}
        </section>
        <section className={styles.appShell__insights} aria-label="Insights">
          {insights}
        </section>
      </div>

      {nav}
    </div>
  );
}

function NavIcon({ pane }: { pane: TrackerPane }) {
  if (pane === "today") {
    return (
      <svg className={styles.appShell__navIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8 3.5v3M16 3.5v3M4 10h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (pane === "calendar") {
    return (
      <svg className={styles.appShell__navIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8 3.5v3M16 3.5v3M7 13h2.5M11.25 13h2.5M15.5 13H18M7 16.5h2.5M11.25 16.5h2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg className={styles.appShell__navIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 14.5h4v5H5v-5ZM10 9h4v10.5h-4V9ZM15 5h4v14.5h-4V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
