"use client";

import { useRef, useState } from "react";

import Link from "next/link";

import { FLOW_LABELS, MOOD_LABELS, SYMPTOM_LABELS } from "@/core/cycle/labels";
import {
  BoneIcon,
  BrainIcon,
  CircleDotIcon,
  CloudRainIcon,
  CloudSunIcon,
  CookieIcon,
  FlameIcon,
  FrownIcon,
  HeartIcon,
  HeartLucideIcon,
  MoonIcon,
  SmileIcon,
  SparklesIcon,
  WavesHorizontalIcon,
  ZapIcon,
} from "@/core/icons";
import { cx } from "@/core/lib/cx";
import {
  FLOW_LEVELS,
  MOODS,
  SYMPTOMS,
  normalizeFlow,
  normalizeMood,
  normalizeSymptom,
  type CycleLog,
  type FlowLevel,
  type Mood,
  type Symptom,
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

const SYMPTOM_ICONS: Record<Symptom, typeof SmileIcon> = {
  HEADACHE: BrainIcon,
  ACNE: SparklesIcon,
  CRAMPS: ZapIcon,
  BREAST_TENDERNESS: HeartLucideIcon,
  BLOATING: CircleDotIcon,
  NAUSEA: FrownIcon,
  BACK_PAIN: BoneIcon,
  CRAVINGS: CookieIcon,
};

type Draft = {
  flow: FlowLevel | null;
  mood: Mood[];
  symptoms: Symptom[];
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
    symptoms: Symptom[];
    notes: string | null;
  }) => Promise<unknown>;
  onDelete: (date: string) => Promise<unknown>;
};

function isEmptyDraft(draft: Draft) {
  return (
    !draft.flow &&
    draft.mood.length === 0 &&
    draft.symptoms.length === 0 &&
    !draft.notes.trim()
  );
}

function toInput(date: string, draft: Draft) {
  return {
    date,
    flow: draft.flow,
    mood: draft.mood,
    symptoms: draft.symptoms,
    notes: draft.notes.trim() || null,
  };
}

function draftFromLog(log: CycleLog | null): Draft {
  return {
    flow: normalizeFlow(log?.flow),
    mood: normalizeMood(log?.mood),
    symptoms: normalizeSymptom(log?.symptoms),
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
  const [symptoms, setSymptoms] = useState<Symptom[]>(initial.symptoms);
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

  function updateSymptom(value: Symptom) {
    const current = draftRef.current.symptoms;
    const nextSymptoms = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setSymptoms(nextSymptoms);
    persist({ ...draftRef.current, symptoms: nextSymptoms });
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
                    styles["logDayPanel__chip--labeled"],
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

        <div className={styles.logDayPanel__field}>
          <span className={styles.logDayPanel__label}>Síntomas</span>
          <div className={styles.logDayPanel__chips} role="group" aria-label="Síntomas">
            {SYMPTOMS.map((value) => {
              const Icon = SYMPTOM_ICONS[value];
              const selected = symptoms.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  className={cx(
                    styles.logDayPanel__chip,
                    styles["logDayPanel__chip--labeled"],
                    selected && styles["logDayPanel__chip--active"],
                  )}
                  onClick={() => updateSymptom(value)}
                >
                  <Icon
                    color={selected ? "#fff" : "#F54927"}
                    width={18}
                    height={18}
                    aria-hidden="true"
                  />
                  {SYMPTOM_LABELS[value]}
                </button>
              );
            })}
          </div>
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
      </div>
    </section>
  );
}
