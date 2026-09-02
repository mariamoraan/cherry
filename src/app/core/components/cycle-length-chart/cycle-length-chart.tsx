"use client";

import { useState } from "react";

import type { CycleRow } from "@/core/cycle/cycle-stats";
import { formatDateRange } from "@/core/cycle/dates";
import { cx } from "@/core/lib/cx";

import styles from "./cycle-length-chart.module.scss";

type CycleLengthChartProps = {
  rows: CycleRow[];
  averageCycleLength: number | null;
  maxCycleDays: number;
  isLoading: boolean;
};

export function CycleLengthChart({
  rows,
  averageCycleLength,
  maxCycleDays,
  isLoading,
}: CycleLengthChartProps) {
  const [tab, setTab] = useState<"status" | "average">("status");
  const current = rows.find((row) => row.isCurrent);

  return (
    <section className={styles.cycleLengthChart}>
      <header className={styles.cycleLengthChart__header}>
        <h1 className={styles.cycleLengthChart__title}>Duración del ciclo</h1>
        <div className={styles.cycleLengthChart__tabs}>
          <button
            type="button"
            className={cx(
              styles.cycleLengthChart__tab,
              tab === "status" && styles["cycleLengthChart__tab--active"],
            )}
            onClick={() => setTab("status")}
          >
            Estado del mes
          </button>
          <button
            type="button"
            className={cx(
              styles.cycleLengthChart__tab,
              tab === "average" && styles["cycleLengthChart__tab--active"],
            )}
            onClick={() => setTab("average")}
          >
            Media
          </button>
        </div>
      </header>

      <p className={styles.cycleLengthChart__status}>
        {statusCopy(tab, current, averageCycleLength)}
      </p>

      {isLoading ? (
        <p className={styles.cycleLengthChart__loading}>Cargando ciclos…</p>
      ) : rows.length === 0 ? (
        <p className={styles.cycleLengthChart__empty}>
          Aún no hay ciclos. Registra varios periodos para ver tu media.
        </p>
      ) : (
        <ul className={styles.cycleLengthChart__list}>
          {rows.map((row) => (
            <li key={row.start} className={styles.cycleLengthChart__row}>
              <span className={styles.cycleLengthChart__dates}>
                {row.isCurrent ? "Ciclo actual: " : ""}
                {formatDateRange(row.start, row.end)}
              </span>
              <div className={styles.cycleLengthChart__track}>
                <div
                  className={styles.cycleLengthChart__bar}
                  style={{ width: barWidth(row.cycleDays, maxCycleDays) }}
                >
                  <div
                    className={styles.cycleLengthChart__period}
                    style={{ width: barWidth(row.periodDays, row.cycleDays) }}
                  />
                </div>
                {averageCycleLength != null && (
                  <span
                    className={styles.cycleLengthChart__average}
                    style={{ left: barWidth(averageCycleLength, maxCycleDays) }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className={styles.cycleLengthChart__days}>
                {row.cycleDays} días
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function barWidth(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.min(100, (value / max) * 100)}%`;
}

function statusCopy(
  tab: "status" | "average",
  current: CycleRow | undefined,
  average: number | null,
): string {
  if (tab === "average") {
    if (average == null) return "Todavía no hay una media: hace falta al menos un ciclo completo.";
    return `Tu media es de ${average} días.`;
  }

  if (!current) return "Cuando registres un periodo verás aquí el ciclo en curso.";
  if (average == null) return `Llevas ${current.cycleDays} días en el ciclo actual.`;
  if (current.cycleDays < average) {
    return `El ciclo actual lleva ${current.cycleDays} días, por debajo de tu media de ${average}.`;
  }
  if (current.cycleDays > average) {
    return `El ciclo actual lleva ${current.cycleDays} días, por encima de tu media de ${average}.`;
  }
  return `El ciclo actual coincide con tu media de ${average} días.`;
}
