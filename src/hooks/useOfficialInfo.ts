import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface OfficialSafety {
  level: 1 | 2 | 3 | 4;
  level_label: string;
  summary: string;
  zones_to_avoid?: string[];
  source: string;
  source_url: string;
}

export interface OfficialVaccines {
  mandatory: string[];
  recommended: string[];
  routine_reminder?: string;
  malaria_risk?: "none" | "low" | "moderate" | "high";
  notes?: string;
  source: string;
  source_url: string;
}

export interface OfficialInfo {
  destination: string;
  safety?: OfficialSafety;
  vaccines?: OfficialVaccines;
  confidence?: number;
  lastChecked: string;
  locale: "fr" | "en";
}

const TTL = 30 * 60 * 1000;

const REFRESH_EVENT = "xplania-official-refresh";

const fetchOfficialInfo = async (destination: string, locale: "fr" | "en"): Promise<OfficialInfo> => {
  const { data: resp, error: err } = await supabase.functions.invoke(
    "visa-official-info",
    { body: { destination, locale } },
  );
  if (err) throw new Error(err.message);
  if (!resp || resp.error) throw new Error(resp?.error || "no_data");
  return resp as OfficialInfo;
};

export function useOfficialInfo(destination: string | undefined, locale: "fr" | "en") {
  const queryClient = useQueryClient();
  const enabled = !!destination && destination.length >= 2;
  const queryKey = ["official-info", destination?.toLowerCase(), locale];

  const { data, isFetching, error } = useQuery({
    queryKey,
    queryFn: () => fetchOfficialInfo(destination as string, locale),
    enabled,
    staleTime: TTL,
  });

  // Sync across instances: when another section refreshes the same destination,
  // pick up the updated cache without re-triggering a network request.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onRefresh = (e: Event) => {
      const detail = (e as CustomEvent<{ destination: string; locale: "fr" | "en" }>).detail;
      if (!detail || !destination) return;
      if (detail.destination.toLowerCase() === destination.toLowerCase() && detail.locale === locale) {
        queryClient.invalidateQueries({ queryKey });
      }
    };
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, locale]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey, refetchType: "active" });
    if (typeof window !== "undefined" && destination) {
      window.dispatchEvent(
        new CustomEvent(REFRESH_EVENT, { detail: { destination, locale } }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, locale]);

  return {
    data: data ?? null,
    loading: enabled && isFetching,
    error: error ? (error instanceof Error ? error.message : "error") : null,
    refresh,
  };
}
