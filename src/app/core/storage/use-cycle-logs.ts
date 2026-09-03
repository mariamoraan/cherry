"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback, useMemo } from "react";

import {
  deleteLocalCycleLog,
  getLocalCycleLogs,
  upsertLocalCycleLog,
} from "./local-store";
import {
  deleteRemoteCycleLog,
  getRemoteCycleLogs,
  upsertRemoteCycleLog,
} from "./remote-store";
import type { CycleLog, CycleLogInput } from "./types";

const CYCLE_LOGS_QUERY_KEY = ["cycle-logs"] as const;

export function useCycleLogs(from?: string, to?: string) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const isAuthenticated = status === "authenticated" && !!session?.user;

  const queryKey = useMemo(
    () => [...CYCLE_LOGS_QUERY_KEY, { from, to, isAuthenticated }] as const,
    [from, to, isAuthenticated],
  );

  const {
    data: logs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () =>
      isAuthenticated
        ? getRemoteCycleLogs(from, to)
        : getLocalCycleLogs(from, to),
    enabled: status !== "loading",
  });

  const upsertMutation = useMutation({
    mutationFn: (input: CycleLogInput) =>
      isAuthenticated
        ? upsertRemoteCycleLog(input)
        : upsertLocalCycleLog(input),
    onSuccess: (saved) => {
      queryClient.setQueriesData<CycleLog[]>(
        { queryKey: CYCLE_LOGS_QUERY_KEY },
        (current) => {
          if (!current) return [saved];
          const without = current.filter((log) => log.date !== saved.date);
          return [...without, saved].sort((a, b) => b.date.localeCompare(a.date));
        },
      );
      void queryClient.invalidateQueries({ queryKey: CYCLE_LOGS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (date: string) =>
      isAuthenticated ? deleteRemoteCycleLog(date) : deleteLocalCycleLog(date),
    onSuccess: (_void, date) => {
      queryClient.setQueriesData<CycleLog[]>(
        { queryKey: CYCLE_LOGS_QUERY_KEY },
        (current) => current?.filter((log) => log.date !== date) ?? [],
      );
      void queryClient.invalidateQueries({ queryKey: CYCLE_LOGS_QUERY_KEY });
    },
  });

  const upsertLog = useCallback(
    async (input: CycleLogInput): Promise<CycleLog> => {
      return upsertMutation.mutateAsync(input);
    },
    [upsertMutation],
  );

  const deleteLog = useCallback(
    async (date: string): Promise<void> => {
      await deleteMutation.mutateAsync(date);
    },
    [deleteMutation],
  );

  return {
    logs,
    isLoading: status === "loading" || isLoading,
    isAuthenticated,
    error,
    refetch,
    upsertLog,
    deleteLog,
    isSaving: upsertMutation.isPending || deleteMutation.isPending,
  };
}
