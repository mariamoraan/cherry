"use server";

import { auth } from "@/auth";
import { db } from "@/core/lib/db";
import {
  MOODS,
  SYMPTOMS,
  normalizeFlow,
  normalizeMood,
  normalizeSymptom,
  parseDateKey,
  toDateKey,
  type CycleLog,
  type CycleLogInput,
} from "@/core/storage/types";
import { z } from "zod";

const flowLevelSchema = z.enum([
  "NONE",
  "SPOTTING",
  "LIGHT",
  "MEDIUM",
  "HEAVY",
]);

const moodSchema = z.enum(MOODS);
const symptomSchema = z.enum(SYMPTOMS);

const cycleLogInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  flow: flowLevelSchema.nullable().optional(),
  mood: z.array(moodSchema).optional(),
  symptoms: z.array(symptomSchema).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

const cycleLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  flow: flowLevelSchema.nullable(),
  mood: z.array(moodSchema),
  symptoms: z.array(symptomSchema),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthRequiredError();
  }
  return session.user.id;
}

function toCycleLog(record: {
  id: string;
  date: Date;
  flow: string | null;
  mood: string[];
  symptoms: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CycleLog {
  return {
    id: record.id,
    date: toDateKey(record.date),
    flow: normalizeFlow(record.flow),
    mood: normalizeMood(record.mood),
    symptoms: normalizeSymptom(record.symptoms),
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getCycleLogs(
  from?: string,
  to?: string,
): Promise<CycleLog[]> {
  const userId = await requireUserId();

  const records = await db.cycleLog.findMany({
    where: {
      userId,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: parseDateKey(from) } : {}),
              ...(to ? { lte: parseDateKey(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
  });

  return records.map(toCycleLog);
}

export async function upsertCycleLog(input: CycleLogInput): Promise<CycleLog> {
  const userId = await requireUserId();
  const data = cycleLogInputSchema.parse(input);
  const date = parseDateKey(data.date);
  const mood = normalizeMood(data.mood);
  const symptoms = normalizeSymptom(data.symptoms);

  const record = await db.cycleLog.upsert({
    where: {
      userId_date: { userId, date },
    },
    create: {
      userId,
      date,
      flow: normalizeFlow(data.flow),
      mood,
      symptoms,
      notes: data.notes ?? null,
    },
    update: {
      flow: normalizeFlow(data.flow),
      mood: { set: mood },
      symptoms: { set: symptoms },
      notes: data.notes ?? null,
    },
  });

  return toCycleLog(record);
}

export async function deleteCycleLog(date: string): Promise<void> {
  const userId = await requireUserId();
  const dateKey = toDateKey(date);

  await db.cycleLog.deleteMany({
    where: {
      userId,
      date: parseDateKey(dateKey),
    },
  });
}

export async function migrateLocalLogs(logs: CycleLog[]): Promise<number> {
  const userId = await requireUserId();
  const parsed = z.array(cycleLogSchema).parse(logs);

  await db.$transaction(
    parsed.map((log) =>
      db.cycleLog.upsert({
        where: {
          userId_date: {
            userId,
            date: parseDateKey(log.date),
          },
        },
        create: {
          userId,
          date: parseDateKey(log.date),
          flow: normalizeFlow(log.flow),
          mood: normalizeMood(log.mood),
          symptoms: normalizeSymptom(log.symptoms),
          notes: log.notes,
        },
        update: {
          flow: normalizeFlow(log.flow),
          mood: { set: normalizeMood(log.mood) },
          symptoms: { set: normalizeSymptom(log.symptoms) },
          notes: log.notes,
        },
      }),
    ),
  );

  return parsed.length;
}
