"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import Link from "next/link";

import { JumpToToday } from "@/core/components/jump-to-today/jump-to-today";
import { cx } from "@/core/lib/cx";

import styles from "./app-shell.module.scss";

export type TrackerPane = "today" | "calendar" | "insights";

export function paneFromPath(pathname: string): TrackerPane {
  if (pathname.startsWith("/insights")) return "insights";
  if (pathname.startsWith("/calendar")) return "calendar";
  return "today";
}

type AppShellProps = {
  pane: TrackerPane;
  formattedDate: string;
  headerAction: ReactNode;
  today: ReactNode;
  calendar: ReactNode;
  datePicker: ReactNode;
  insights: ReactNode;
  nav: ReactNode;
  showJumpToToday: boolean;
  onJumpToToday: () => void;
};

const NAV_ITEMS: Array<{ pane: TrackerPane; href: string; label: string }> = [
  { pane: "today", href: "/dashboard", label: "Hoy" },
  { pane: "calendar", href: "/calendar", label: "Calendario" },
  { pane: "insights", href: "/insights", label: "Insights" },
];

type OverlayPhase = "closed" | "opening" | "open" | "closing";

export function AppShell({
  pane,
  formattedDate,
  headerAction,
  today,
  calendar,
  datePicker,
  insights,
  nav,
  showJumpToToday,
  onJumpToToday,
}: AppShellProps) {
  const [datePopoverPhase, setDatePopoverPhase] =
    useState<OverlayPhase>("closed");
  const datePopoverAnchorRef = useRef<HTMLDivElement | null>(null);
  const headerNavRef = useRef<HTMLElement | null>(null);
  const [navPill, setNavPill] = useState({ left: 0, width: 0 });
  const [navPillReady, setNavPillReady] = useState(false);

  const isDatePopoverMounted = datePopoverPhase !== "closed";
  const isDatePopoverOpen = datePopoverPhase === "open";
  const isDatePopoverExpanded =
    datePopoverPhase === "opening" || datePopoverPhase === "open";

  function openDatePopover() {
    setDatePopoverPhase((phase) =>
      phase === "closed" || phase === "closing" ? "opening" : phase,
    );
  }

  function closeDatePopover() {
    setDatePopoverPhase((phase) =>
      phase === "open" || phase === "opening" ? "closing" : phase,
    );
  }

  function toggleDatePopover() {
    if (isDatePopoverExpanded) closeDatePopover();
    else openDatePopover();
  }

  useEffect(() => {
    if (datePopoverPhase !== "opening") return;
    const id = requestAnimationFrame(() => setDatePopoverPhase("open"));
    return () => cancelAnimationFrame(id);
  }, [datePopoverPhase]);

  useEffect(() => {
    if (!isDatePopoverExpanded) return;

    const handleDocumentPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (datePopoverAnchorRef.current?.contains(target)) return;
      closeDatePopover();
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDatePopover();
    };

    document.addEventListener("mousedown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isDatePopoverExpanded]);

  useLayoutEffect(() => {
    const navEl = headerNavRef.current;
    if (!navEl) return;

    const media = window.matchMedia("(min-width: 768px)");

    const updatePill = () => {
      if (!media.matches) {
        setNavPillReady(false);
        return;
      }
      const active = navEl.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active || active.offsetWidth <= 0) return;
      setNavPill({ left: active.offsetLeft, width: active.offsetWidth });
      setNavPillReady(true);
    };

    updatePill();
    media.addEventListener("change", updatePill);
    window.addEventListener("resize", updatePill);

    const observer = new ResizeObserver(updatePill);
    observer.observe(navEl);

    return () => {
      media.removeEventListener("change", updatePill);
      window.removeEventListener("resize", updatePill);
      observer.disconnect();
    };
  }, [pane]);

  const pickerElement = isValidElement(datePicker)
    ? (datePicker as ReactElement<{
        onSelectDate?: (date: string) => void;
        variant?: "default" | "sm";
      }>)
    : null;

  const pickerForPopover = pickerElement?.props.onSelectDate
    ? cloneElement(pickerElement, {
        onSelectDate: (date: string) => {
          pickerElement.props.onSelectDate?.(date);
          closeDatePopover();
        },
        variant: "sm",
      })
    : datePicker;

  return (
    <div className={styles.appShell}>
      <header className={styles.appShell__header}>
        <div
          className={styles.appShell__datePopoverAnchor}
          ref={datePopoverAnchorRef}
        >
          <button
            type="button"
            className={styles.appShell__date}
            aria-haspopup="dialog"
            aria-expanded={isDatePopoverExpanded}
            aria-controls="calendar-date-popover"
            onClick={toggleDatePopover}
          >
            {formattedDate}
          </button>

          {isDatePopoverMounted && (
            <div
              className={cx(
                styles.appShell__datePopover,
                isDatePopoverOpen && styles["appShell__datePopover--open"],
              )}
              id="calendar-date-popover"
              role="dialog"
              aria-label="Calendario"
              onTransitionEnd={(event) => {
                if (event.target !== event.currentTarget) return;
                if (datePopoverPhase === "closing") {
                  setDatePopoverPhase("closed");
                }
              }}
            >
              <section className={styles.appShell__calendarPopoverCard}>
                {pickerForPopover}
              </section>
            </div>
          )}
        </div>
        <nav
          ref={headerNavRef}
          className={cx(
            styles.appShell__nav,
            navPillReady && styles["appShell__nav--ready"],
          )}
          aria-label="Principal"
          style={
            {
              "--nav-pill-left": `${navPill.left}px`,
              "--nav-pill-width": `${navPill.width}px`,
            } as CSSProperties
          }
        >
          <span className={styles.appShell__navPill} aria-hidden="true" />
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
        <section
          className={cx(
            styles.appShell__pane,
            pane === "today" && styles["appShell__pane--active"],
          )}
          aria-label="Hoy"
          aria-hidden={pane !== "today"}
          inert={pane !== "today" ? true : undefined}
        >
          {today}
        </section>
        <section
          className={cx(
            styles.appShell__pane,
            styles.appShell__calendar,
            pane === "calendar" && styles["appShell__pane--active"],
          )}
          aria-label="Calendario"
          aria-hidden={pane !== "calendar"}
          inert={pane !== "calendar" ? true : undefined}
        >
          {calendar}
        </section>
        <section
          className={cx(
            styles.appShell__pane,
            pane === "insights" && styles["appShell__pane--active"],
          )}
          aria-label="Insights"
          aria-hidden={pane !== "insights"}
          inert={pane !== "insights" ? true : undefined}
        >
          {insights}
        </section>
      </div>

      <JumpToToday visible={showJumpToToday} onClick={onJumpToToday} />
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
