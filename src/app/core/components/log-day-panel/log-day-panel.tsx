"use client";

import { useRef, useState } from "react";

import Link from "next/link";

import { FLOW_LABELS } from "@/core/cycle/labels";
import { cx } from "@/core/lib/cx";
import { FLOW_LEVELS, type CycleLog, type FlowLevel } from "@/core/storage/types";

import styles from "./log-day-panel.module.scss";

type Draft = {
  flow: FlowLevel;
  mood: string;
  pain: string;
  notes: string;
};

type LogDayPanelProps = {
  date: string;
  log: CycleLog | null;
  isAuthenticated: boolean;
  isSaving: boolean;
  onSave: (input: {
    date: string;
    flow: FlowLevel;
    mood: number | null;
    pain: number | null;
    notes: string | null;
  }) => Promise<unknown>;
  onDelete: (date: string) => Promise<unknown>;
};

function toInput(date: string, draft: Draft) {
  return {
    date,
    flow: draft.flow,
    mood: draft.mood ? Number(draft.mood) : null,
    pain: draft.pain ? Number(draft.pain) : null,
    notes: draft.notes.trim() || null,
  };
}

export function LogDayPanel({
  date,
  log,
  isAuthenticated,
  isSaving,
  onSave,
  onDelete,
}: LogDayPanelProps) {
  const [flow, setFlow] = useState<FlowLevel>(log?.flow ?? "NONE");
  const [mood, setMood] = useState(log?.mood?.toString() ?? "");
  const [pain, setPain] = useState(log?.pain?.toString() ?? "");
  const [notes, setNotes] = useState(log?.notes ?? "");
  const draftRef = useRef<Draft>({ flow, mood, pain, notes });
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function persist(next: Draft) {
    draftRef.current = next;
    void onSave(toInput(date, next));
  }

  function updateFlow(level: FlowLevel) {
    setFlow(level);
    persist({ ...draftRef.current, flow: level });
  }

  function updateMood(value: string) {
    setMood(value);
    persist({ ...draftRef.current, mood: value });
  }

  function updatePain(value: string) {
    setPain(value);
    persist({ ...draftRef.current, pain: value });
  }

  function updateNotes(value: string) {
    setNotes(value);
    draftRef.current = { ...draftRef.current, notes: value };
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      persist(draftRef.current);
    }, 400);
  }

  function flushNotes() {
    if (notesTimer.current) {
      clearTimeout(notesTimer.current);
      notesTimer.current = null;
    }
    persist(draftRef.current);
  }

  return (
    <section className={styles.logDayPanel} aria-labelledby="log-day-title">
      <div className={styles.logDayPanel__heading}>
        <span className={styles.logDayPanel__icon} aria-hidden="true">
          <HeartIcon />
        </span>
        <h2 id="log-day-title" className={styles.logDayPanel__title}>
          Cuéntanos tu día
        </h2>
        {isSaving && (
          <span className={styles.logDayPanel__saving} role="status">
            Guardando…
          </span>
        )}
      </div>

      {!isAuthenticated && (
        <p className={styles.logDayPanel__banner}>
          Se guarda en este dispositivo.{" "}
          <Link href="/login" className={styles.logDayPanel__link}>
            Inicia sesión
          </Link>{" "}
          para sincronizarlo.
        </p>
      )}

      <div className={styles.logDayPanel__form}>
        <div className={styles.logDayPanel__field}>
          <span className={styles.logDayPanel__label}>Flujo</span>
          <div className={styles.logDayPanel__chips}>
            {FLOW_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={cx(
                  styles.logDayPanel__chip,
                  flow === level && styles["logDayPanel__chip--active"],
                )}
                onClick={() => updateFlow(level)}
              >
                {FLOW_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.logDayPanel__row}>
          <label className={styles.logDayPanel__field}>
            <span className={styles.logDayPanel__label}>Ánimo (1–5)</span>
            <input
              className={styles.logDayPanel__input}
              type="number"
              min={1}
              max={5}
              value={mood}
              onChange={(event) => updateMood(event.target.value)}
              placeholder="—"
            />
          </label>
          <label className={styles.logDayPanel__field}>
            <span className={styles.logDayPanel__label}>Dolor (0–10)</span>
            <input
              className={styles.logDayPanel__input}
              type="number"
              min={0}
              max={10}
              value={pain}
              onChange={(event) => updatePain(event.target.value)}
              placeholder="—"
            />
          </label>
        </div>

        <label className={styles.logDayPanel__field}>
          <span className={styles.logDayPanel__label}>Notas</span>
          <textarea
            className={styles.logDayPanel__textarea}
            rows={3}
            value={notes}
            onChange={(event) => updateNotes(event.target.value)}
            onBlur={flushNotes}
            placeholder="Opcional"
          />
        </label>

        {log && (
          <button
            type="button"
            className={styles.logDayPanel__delete}
            onClick={() => void onDelete(date)}
            disabled={isSaving}
          >
            Eliminar registro
          </button>
        )}
      </div>
    </section>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M12 20s-7-4.4-9.2-8.2C1.2 9 2.2 5.8 5.4 5.2c1.8-.3 3.4.5 4.4 1.8C10.8 5.7 12.4 4.9 14.2 5.2c3.2.6 4.2 3.8 2.6 6.6C19 15.6 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
