"use client";

import Link from "next/link";

import type { TrackerPane } from "@/core/components/app-shell/app-shell";
import { cx } from "@/core/lib/cx";

import styles from "./bottom-nav.module.scss";

type BottomNavProps = {
  pane: TrackerPane;
};

export function BottomNav({ pane }: BottomNavProps) {
  return (
    <nav className={styles.bottomNav} aria-label="Principal">
      <Link
        href="/dashboard"
        className={cx(
          styles.bottomNav__item,
          pane === "today" && styles["bottomNav__item--active"],
        )}
        aria-current={pane === "today" ? "page" : undefined}
      >
        <TodayIcon />
        Hoy
      </Link>
      <Link
        href="/calendar"
        className={cx(
          styles.bottomNav__item,
          pane === "calendar" && styles["bottomNav__item--active"],
        )}
        aria-current={pane === "calendar" ? "page" : undefined}
      >
        <CalendarIcon />
        Calendario
      </Link>
      <Link
        href="/insights"
        className={cx(
          styles.bottomNav__item,
          pane === "insights" && styles["bottomNav__item--active"],
        )}
        aria-current={pane === "insights" ? "page" : undefined}
      >
        <InsightsIcon />
        Insights
      </Link>
    </nav>
  );
}

function TodayIcon() {
  return (
    <svg
      className={styles.bottomNav__icon}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3.5v3M16 3.5v3M4 10h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className={styles.bottomNav__icon}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3.5v3M16 3.5v3M7 13h2.5M11.25 13h2.5M15.5 13H18M7 16.5h2.5M11.25 16.5h2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg
      className={styles.bottomNav__icon}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 14.5h4v5H5v-5ZM10 9h4v10.5h-4V9ZM15 5h4v14.5h-4V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
