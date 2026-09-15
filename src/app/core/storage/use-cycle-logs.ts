"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback, useMemo } from "react";

import {
  deleteLocalCycleLog,
  getLocalCycleLogs,
  getLocalCycleSummary,
  upsertLocalCycleLog,
} from "./local-store";
import {
  deleteRemoteCycleLog,
  getRemoteCycleLogs,
  getRemoteCycleSummary,
  upsertRemoteCycleLog,
} from "./remote-store";
import type { CycleLog, CycleLogInput } from "./types";

export const CYCLE_LOGS_QUERY_KEY = ["cycle-logs"] as const;
export const CYCLE_SUMMARY_QUERY_KEY = ["cycle-summary"] as const;

type CycleLogsFilter = {
  from?: string;
  to?: string;
  isAuthenticated: boolean;
};

function isDateInRange(date: string, from?: string, to?: string): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function filterFromQueryKey(queryKey: QueryKey): CycleLogsFilter | undefined {
  const filter = queryKey[1];
  if (!filter || typeof filter !== "object") return undefined;
  return filter as CycleLogsFilter;
}

function patchCycleLogQueries(
  queryClient: QueryClient,
  updater: (current: CycleLog[], filter: CycleLogsFilter | undefined) => CycleLog[],
) {
  for (const [queryKey, data] of queryClient.getQueriesData<CycleLog[]>({
    queryKey: CYCLE_LOGS_QUERY_KEY,
  })) {
    queryClient.setQueryData<CycleLog[]>(
      queryKey,
      updater(data ?? [], filterFromQueryKey(queryKey)),
    );
  }
}

export function useCycleSummary(today: string) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;

  const query = useQuery({
    queryKey: [...CYCLE_SUMMARY_QUERY_KEY, { today, isAuthenticated }] as const,
    queryFn: () =>
      isAuthenticated
        ? getRemoteCycleSummary(today)
        : getLocalCycleSummary(today),
    enabled: status !== "loading",
  });

  return {
    summary: query.data,
    isLoading: status === "loading" || query.isPending,
    error: query.error,
  };
}

export function useCycleLogs(
  from?: string,
  to?: string,
  enabled = true,
) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const isAuthenticated = status === "authenticated" && !!session?.user;

  const queryKey = useMemo(
    () => [...CYCLE_LOGS_QUERY_KEY, { from, to, isAuthenticated }] as const,
    [from, to, isAuthenticated],
  );

  const {
    data: logs = [],
    isPending,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () =>
      isAuthenticated
        ? getRemoteCycleLogs(from, to)
        : getLocalCycleLogs(from, to),
    enabled: enabled && status !== "loading",
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });

  const upsertMutation = useMutation({
    mutationFn: (input: CycleLogInput) =>
      isAuthenticated
        ? upsertRemoteCycleLog(input)
        : upsertLocalCycleLog(input),
    onSuccess: (saved) => {
      patchCycleLogQueries(queryClient, (current, filter) => {
        const without = current.filter((log) => log.date !== saved.date);
        if (!isDateInRange(saved.date, filter?.from, filter?.to)) {
          return without;
        }
        return [...without, saved].sort((a, b) => b.date.localeCompare(a.date));
      });
      void queryClient.invalidateQueries({ queryKey: CYCLE_LOGS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CYCLE_SUMMARY_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (date: string) =>
      isAuthenticated ? deleteRemoteCycleLog(date) : deleteLocalCycleLog(date),
    onSuccess: (_void, date) => {
      patchCycleLogQueries(queryClient, (current) =>
        current.filter((log) => log.date !== date),
      );
      void queryClient.invalidateQueries({ queryKey: CYCLE_LOGS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CYCLE_SUMMARY_QUERY_KEY });
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
    isLoading: status === "loading" || (enabled && isPending),
    isFetching: enabled && isFetching,
    isAuthenticated,
    error,
    refetch,
    upsertLog,
    deleteLog,
    isSaving: upsertMutation.isPending || deleteMutation.isPending,
  };
}
