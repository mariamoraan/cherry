import {
  deleteCycleLog,
  getCycleLogs,
  getCycleSummary,
  migrateLocalLogs,
  upsertCycleLog,
} from "@/core/actions/cycle-logs";
import type { CycleSummary } from "@/core/cycle/summary";
import type { CycleLog, CycleLogInput } from "./types";

export async function getRemoteCycleLogs(
  from?: string,
  to?: string,
): Promise<CycleLog[]> {
  return getCycleLogs(from, to);
}

export async function getRemoteCycleSummary(
  today: string,
): Promise<CycleSummary> {
  return getCycleSummary(today);
}

export async function upsertRemoteCycleLog(
  input: CycleLogInput,
): Promise<CycleLog> {
  return upsertCycleLog(input);
}

export async function deleteRemoteCycleLog(date: string): Promise<void> {
  return deleteCycleLog(date);
}

export async function migrateRemoteLogs(logs: CycleLog[]): Promise<number> {
  return migrateLocalLogs(logs);
}
