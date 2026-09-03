"use client";

import type { CycleRow } from "@/core/cycle/cycle-stats";
import { formatDateRange } from "@/core/cycle/dates";
import {
  formatInsightsPredictionHeadline,
  type PeriodPrediction,
} from "@/core/cycle/prediction";
import { cx } from "@/core/lib/cx";

import styles from "./insights-view.module.scss";

type InsightsViewProps = {
  rows: CycleRow[];
  averageCycleLength: number | null;
  averagePeriodLength: number | null;
  maxCycleDays: number;
  prediction: PeriodPrediction | null;
  periodDay: number | null;
  isLoading: boolean;
};

export function InsightsView({
  rows,
  averageCycleLength,
  averagePeriodLength,
  maxCycleDays,
  prediction,
  periodDay,
  isLoading,
}: InsightsViewProps) {
  const headline = formatInsightsPredictionHeadline(prediction, periodDay);

  return (
    <div className={styles.insightsView}>
      <section className={styles.insightsView__hero} aria-label="Próxima regla">
        <p className={styles.insightsView__eyebrow}>Tu ritmo</p>
        <h1 className={styles.insightsView__title}>{headline.title}</h1>
        <p className={styles.insightsView__subtitle}>{headline.subtitle}</p>
      </section>

      <section className={styles.insightsView__cycles} aria-label="Duración del ciclo">
        <h2 className={styles.insightsView__sectionTitle}>Duración del ciclo</h2>
        {averageCycleLength != null ? (
          <p className={styles.insightsView__sectionCopy}>
            Tu media es de {averageCycleLength} días
            {averagePeriodLength != null
              ? `. El sangrado dura ${averagePeriodLength} días de media.`
              : "."}
          </p>
        ) : (
          <p className={styles.insightsView__sectionCopy}>
            Registra unos periodos para ver tu ritmo.
          </p>
        )}

        {isLoading ? (
          <p className={styles.insightsView__status}>Cargando ciclos…</p>
        ) : rows.length === 0 ? (
          <p className={styles.insightsView__status}>
            Aún no hay ciclos. Registra varios periodos para ver tu media.
          </p>
        ) : (
          <ul className={styles.insightsView__list}>
            {rows.map((row, index) => (
              <li
                key={row.start}
                className={cx(
                  styles.insightsView__row,
                  row.isCurrent && styles["insightsView__row--current"],
                )}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <span className={styles.insightsView__dates}>
                  {row.isCurrent ? "Actual · " : ""}
                  {formatDateRange(row.start, row.end)}
                </span>
                <div className={styles.insightsView__track}>
                  <div
                    className={styles.insightsView__bar}
                    style={{ width: barWidth(row.cycleDays, maxCycleDays) }}
                  >
                    <div
                      className={styles.insightsView__period}
                      style={{ width: barWidth(row.periodDays, row.cycleDays) }}
                    />
                  </div>
                  {averageCycleLength != null && (
                    <span
                      className={styles.insightsView__average}
                      style={{ left: barWidth(averageCycleLength, maxCycleDays) }}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className={styles.insightsView__days}>{row.cycleDays} d</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function barWidth(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.min(100, (value / max) * 100)}%`;
}
