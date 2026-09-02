export const FLOW_LEVELS = [
  "NONE",
  "SPOTTING",
  "LIGHT",
  "MEDIUM",
  "HEAVY",
] as const;

export type FlowLevel = (typeof FLOW_LEVELS)[number];

export type CycleLog = {
  id: string;
  date: string;
  flow: FlowLevel | null;
  mood: number | null;
  pain: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CycleLogInput = {
  date: string;
  flow?: FlowLevel | null;
  mood?: number | null;
  pain?: number | null;
  notes?: string | null;
};

export function toDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}
