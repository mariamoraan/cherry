import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import {
  normalizeFlow,
  normalizeMood,
  parseDateKey,
  toDateKey,
  type CycleLog,
  type CycleLogInput,
} from "./types";

const DB_NAME = "cherry";
const DB_VERSION = 1;
const STORE_NAME = "cycle-logs";

interface CherryDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: CycleLog;
    indexes: { "by-date": string };
  };
}

let dbPromise: Promise<IDBPDatabase<CherryDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<CherryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by-date", "date");
      },
    });
  }
  return dbPromise;
}

function pick<T>(incoming: T | undefined, fallback: T): T {
  return incoming !== undefined ? incoming : fallback;
}

function createLog(input: CycleLogInput, existing?: CycleLog): CycleLog {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    date: toDateKey(input.date),
    flow: normalizeFlow(pick(input.flow, existing?.flow ?? null)),
    mood: normalizeMood(pick(input.mood, existing?.mood ?? [])),
    pain: pick(input.pain, existing?.pain ?? null),
    notes: pick(input.notes, existing?.notes ?? null),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function getLocalCycleLogs(
  from?: string,
  to?: string,
): Promise<CycleLog[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex(STORE_NAME, "by-date");

  return all
    .filter((log) => {
      if (from && log.date < from) return false;
      if (to && log.date > to) return false;
      return true;
    })
    .map((log) => ({
      ...log,
      flow: normalizeFlow(log.flow),
      mood: normalizeMood(log.mood),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLocalCycleLogByDate(
  date: string,
): Promise<CycleLog | undefined> {
  const dateKey = toDateKey(date);
  const logs = await getLocalCycleLogs(dateKey, dateKey);
  return logs[0];
}

export async function upsertLocalCycleLog(
  input: CycleLogInput,
): Promise<CycleLog> {
  const db = await getDb();
  const dateKey = toDateKey(input.date);
  const existing = await getLocalCycleLogByDate(dateKey);
  const log = createLog({ ...input, date: dateKey }, existing);

  await db.put(STORE_NAME, log);
  return log;
}

export async function deleteLocalCycleLog(date: string): Promise<void> {
  const existing = await getLocalCycleLogByDate(date);
  if (!existing) return;

  const db = await getDb();
  await db.delete(STORE_NAME, existing.id);
}

export async function hasLocalCycleLogs(): Promise<boolean> {
  const db = await getDb();
  const count = await db.count(STORE_NAME);
  return count > 0;
}

export async function getAllLocalCycleLogs(): Promise<CycleLog[]> {
  return getLocalCycleLogs();
}

export async function clearLocalCycleLogs(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAME);
}

export { parseDateKey, toDateKey };
