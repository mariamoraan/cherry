import type { FlowLevel } from "@/core/storage/types";

export const FLOW_LABELS: Record<FlowLevel, string> = {
  NONE: "Ninguno",
  SPOTTING: "Manchado",
  LIGHT: "Ligero",
  MEDIUM: "Moderado",
  HEAVY: "Abundante",
};

export function getFirstName(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}
