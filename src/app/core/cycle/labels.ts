import type { FlowLevel, Mood, Symptom } from "@/core/storage/types";

export const FLOW_LABELS: Record<FlowLevel, string> = {
  SPOTTING: "Manchado",
  LIGHT: "Ligero",
  MEDIUM: "Moderado",
  HEAVY: "Abundante",
};

export const MOOD_LABELS: Record<Mood, string> = {
  HAPPY: "Feliz",
  CALM: "Tranquila",
  SAD: "Triste",
  IRRITABLE: "Irritable",
  ANXIOUS: "Ansiosa",
  TIRED: "Cansada",
  ENERGETIC: "Energética",
  SENSITIVE: "Sensible",
};

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  HEADACHE: "Dolor de cabeza",
  ACNE: "Acné",
  CRAMPS: "Cólicos",
  BREAST_TENDERNESS: "Sensibilidad en pechos",
  BLOATING: "Hinchazón",
  NAUSEA: "Náuseas",
  BACK_PAIN: "Dolor de espalda",
  CRAVINGS: "Antojo",
};

export function getFirstName(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}
