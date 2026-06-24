"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJson, ApiError } from "@/shared/lib/api";
import type {
  TeamOverview,
  ColleagueDetail,
  TeamInsightsFilters,
  GrowthGranularity,
} from "../types";

export interface UseTeamInsightsParams {
  granularity?: GrowthGranularity;
  days?: number;
  filters?: TeamInsightsFilters;
  pollMs?: number;
}

export interface UseTeamInsightsResult {
  overview: TeamOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

export function useTeamInsights(
  params: UseTeamInsightsParams = {}
): UseTeamInsightsResult {
  const { granularity = "month", days = 90, filters, pollMs } = params;
  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("granularity", granularity);
    sp.set("days", String(days));
    if (filters?.seniority) sp.set("seniority", filters.seniority);
    if (filters?.position) sp.set("position", filters.position);
    if (filters?.sentiment) sp.set("sentiment", filters.sentiment);
    if (filters?.risk) sp.set("risk", filters.risk);
    if (filters?.since) sp.set("since", filters.since);
    return sp.toString();
  }, [granularity, days, filters]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJson<TeamOverview>(
          `/api/team-insights/overview?${query}`
        );
        if (!cancelled) setOverview(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "No pudimos cargar los insights.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    if (!pollMs) return;
    const id = setInterval(run, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [query, tick, pollMs]);

  return {
    overview,
    loading,
    error,
    refresh,
    lastUpdated: overview ? new Date() : null,
  };
}

export function useColleagueDetail(employeeId: string | null, days = 90) {
  const [detail, setDetail] = useState<ColleagueDetail | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!employeeId) {
      return () => {
        cancelled = true;
      };
    }
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJson<ColleagueDetail>(
          `/api/team-insights/colleagues/${encodeURIComponent(
            employeeId
          )}?days=${days}`
        );
        if (!cancelled) {
          setDetail(data);
          setLoadedFor(employeeId);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError ? e.message : "No pudimos cargar el detalle."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [employeeId, days]);

  const safeDetail = loadedFor && loadedFor === employeeId ? detail : null;
  return { detail: safeDetail, loading, error };
}
