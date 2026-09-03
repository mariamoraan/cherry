export const FLOW_LEVELS = [
  "LIGHT",
  "SPOTTING",
  "MEDIUM",
  "HEAVY",
] as const;

export type FlowLevel = (typeof FLOW_LEVELS)[number];

export function normalizeFlow(
  flow: string | null | undefined,
): FlowLevel | null {
  if (!flow) return null;
  return (FLOW_LEVELS as readonly string[]).includes(flow)
    ? (flow as FlowLevel)
    : null;
}

export const MOODS = [
  "HAPPY",
  "CALM",
  "SAD",
  "IRRITABLE",
  "ANXIOUS",
  "TIRED",
  "ENERGETIC",
  "SENSITIVE",
] as const;

export type Mood = (typeof MOODS)[number];

export function normalizeMood(value: unknown): Mood[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Mood =>
    (MOODS as readonly string[]).includes(item as string),
  );
}

export const SYMPTOMS = [
  "HEADACHE",
  "ACNE",
  "CRAMPS",
  "BREAST_TENDERNESS",
  "BLOATING",
  "NAUSEA",
  "BACK_PAIN",
  "CRAVINGS",
] as const;

export type Symptom = (typeof SYMPTOMS)[number];

export function normalizeSymptom(value: unknown): Symptom[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Symptom =>
    (SYMPTOMS as readonly string[]).includes(item as string),
  );
}

export type CycleLog = {
  id: string;
  date: string;
  flow: FlowLevel | null;
  mood: Mood[];
  symptoms: Symptom[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CycleLogInput = {
  date: string;
  flow?: FlowLevel | null;
  mood?: Mood[];
  symptoms?: Symptom[];
  notes?: string | null;
};

export function toDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}
