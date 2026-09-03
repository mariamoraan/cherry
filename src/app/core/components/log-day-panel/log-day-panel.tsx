"use client";

import { useRef, useState } from "react";

import Link from "next/link";

import { FLOW_LABELS, MOOD_LABELS } from "@/core/cycle/labels";
import {
  CloudRainIcon,
  CloudSunIcon,
  FlameIcon,
  FrownIcon,
  HeartLucideIcon,
  MoonIcon,
  SmileIcon,
  WavesHorizontalIcon,
  ZapIcon,
} from "@/core/icons";
import { cx } from "@/core/lib/cx";
import {
  FLOW_LEVELS,
  MOODS,
  normalizeFlow,
  normalizeMood,
  type CycleLog,
  type FlowLevel,
  type Mood,
} from "@/core/storage/types";

import styles from "./log-day-panel.module.scss";

const MOOD_ICONS: Record<Mood, typeof SmileIcon> = {
  HAPPY: SmileIcon,
  CALM: CloudSunIcon,
  SAD: FrownIcon,
  IRRITABLE: FlameIcon,
  ANXIOUS: CloudRainIcon,
  TIRED: MoonIcon,
  ENERGETIC: ZapIcon,
  SENSITIVE: HeartLucideIcon,
};

type Draft = {
  flow: FlowLevel | null;
  mood: Mood[];
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
    flow: FlowLevel | null;
    mood: Mood[];
    pain: number | null;
    notes: string | null;
  }) => Promise<unknown>;
  onDelete: (date: string) => Promise<unknown>;
};

function isEmptyDraft(draft: Draft) {
  return !draft.flow && draft.mood.length === 0 && !draft.pain && !draft.notes.trim();
}

function toInput(date: string, draft: Draft) {
  return {
    date,
    flow: draft.flow,
    mood: draft.mood,
    pain: draft.pain ? Number(draft.pain) : null,
    notes: draft.notes.trim() || null,
  };
}

function draftFromLog(log: CycleLog | null): Draft {
  return {
    flow: normalizeFlow(log?.flow),
    mood: normalizeMood(log?.mood),
    pain: log?.pain?.toString() ?? "",
    notes: log?.notes ?? "",
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
  const initial = draftFromLog(log);
  const [flow, setFlow] = useState<FlowLevel | null>(initial.flow);
  const [mood, setMood] = useState<Mood[]>(initial.mood);
  const [pain, setPain] = useState(initial.pain);
  const [notes, setNotes] = useState(initial.notes);
  const draftRef = useRef<Draft>(initial);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRecordRef = useRef(!!log);
  const saveChain = useRef(Promise.resolve<unknown>(undefined));

  function persist(next: Draft) {
    draftRef.current = next;
    if (isEmptyDraft(next)) {
      if (hasRecordRef.current) {
        hasRecordRef.current = false;
        saveChain.current = saveChain.current
          .catch(() => undefined)
          .then(() => onDelete(date));
      }
      return;
    }
    hasRecordRef.current = true;
    const payload = toInput(date, next);
    saveChain.current = saveChain.current
      .catch(() => undefined)
      .then(() => onSave(payload));
  }

  function updateFlow(level: FlowLevel) {
    const nextFlow = draftRef.current.flow === level ? null : level;
    setFlow(nextFlow);
    persist({ ...draftRef.current, flow: nextFlow });
  }

  function updateMood(value: Mood) {
    const current = draftRef.current.mood;
    const nextMood = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setMood(nextMood);
    persist({ ...draftRef.current, mood: nextMood });
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

  const getFlowIconSize = (level: FlowLevel): number => {
    switch (level) {
      case "LIGHT":
        return 16;
      case "SPOTTING":
        return 20;
      case "MEDIUM":
        return 24;
      case "HEAVY":
        return 28;
    }
  };

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
          <div className={styles.logDayPanel__chips} role="group" aria-label="Flujo">
            {FLOW_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                aria-label={FLOW_LABELS[level]}
                aria-pressed={flow === level}
                className={cx(
                  styles.logDayPanel__chip,
                  flow === level && styles["logDayPanel__chip--active"],
                )}
                onClick={() => updateFlow(level)}
              >
                <WavesHorizontalIcon
                  className="logDayPanel__chip__icon"
                  color={flow === level ? "#fff" : "#F54927"}
                  width={getFlowIconSize(level)}
                  height={getFlowIconSize(level)}
                />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.logDayPanel__field}>
          <span className={styles.logDayPanel__label}>Ánimo</span>
          <div className={styles.logDayPanel__chips} role="group" aria-label="Ánimo">
            {MOODS.map((value) => {
              const Icon = MOOD_ICONS[value];
              const selected = mood.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  className={cx(
                    styles.logDayPanel__chip,
                    styles["logDayPanel__chip--mood"],
                    selected && styles["logDayPanel__chip--active"],
                  )}
                  onClick={() => updateMood(value)}
                >
                  <Icon
                    color={selected ? "#fff" : "#F54927"}
                    width={18}
                    height={18}
                    aria-hidden="true"
                  />
                  {MOOD_LABELS[value]}
                </button>
              );
            })}
          </div>
        </div>

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
