import {
  getAllLocalCycleLogs,
  hasLocalCycleLogs,
  clearLocalCycleLogs,
} from "./local-store";
import { migrateRemoteLogs } from "./remote-store";

const MIGRATION_FLAG_KEY = "cherry:migration-done";

export async function migrateLocalToRemote(): Promise<{
  migrated: number;
  skipped: boolean;
}> {
  if (typeof window === "undefined") {
    return { migrated: 0, skipped: true };
  }

  if (sessionStorage.getItem(MIGRATION_FLAG_KEY) === "true") {
    const stillHasLocal = await hasLocalCycleLogs();
    if (!stillHasLocal) {
      return { migrated: 0, skipped: true };
    }
  }

  const hasLocal = await hasLocalCycleLogs();
  if (!hasLocal) {
    sessionStorage.setItem(MIGRATION_FLAG_KEY, "true");
    return { migrated: 0, skipped: true };
  }

  const logs = await getAllLocalCycleLogs();
  const count = await migrateRemoteLogs(logs);
  await clearLocalCycleLogs();
  sessionStorage.setItem(MIGRATION_FLAG_KEY, "true");

  return { migrated: count, skipped: false };
}

export function resetMigrationFlag(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(MIGRATION_FLAG_KEY);
  }
}
