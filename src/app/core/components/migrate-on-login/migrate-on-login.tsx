"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { migrateLocalToRemote } from "@/core/storage/migrate";

import styles from "./migrate-on-login.module.scss";

export function MigrateOnLogin() {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const previousStatus = useRef(status);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const wasUnauthenticated =
      previousStatus.current === "unauthenticated" ||
      previousStatus.current === "loading";
    previousStatus.current = status;

    if (status !== "authenticated" || !wasUnauthenticated) {
      return;
    }

    let cancelled = false;

    async function runMigration() {
      try {
        const result = await migrateLocalToRemote();
        if (cancelled) return;

        if (result.migrated > 0) {
          setMessage(
            `${result.migrated} registro${result.migrated === 1 ? "" : "s"} sincronizado${result.migrated === 1 ? "" : "s"} con tu cuenta.`,
          );
          await queryClient.invalidateQueries({ queryKey: ["cycle-logs"] });
        }
      } catch {
        if (!cancelled) {
          setMessage("No se pudieron sincronizar los datos locales.");
        }
      }
    }

    void runMigration();

    return () => {
      cancelled = true;
    };
  }, [status, queryClient]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div role="status" className={styles.migrateToast}>
      {message}
    </div>
  );
}
