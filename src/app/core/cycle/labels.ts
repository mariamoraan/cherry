import type { FlowLevel, Mood } from "@/core/storage/types";

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

export function getFirstName(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}
