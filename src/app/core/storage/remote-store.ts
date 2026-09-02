import {
  deleteCycleLog,
  getCycleLogs,
  migrateLocalLogs,
  upsertCycleLog,
} from "@/core/actions/cycle-logs";
import type { CycleLog, CycleLogInput } from "./types";

export async function getRemoteCycleLogs(
  from?: string,
  to?: string,
): Promise<CycleLog[]> {
  return getCycleLogs(from, to);
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
