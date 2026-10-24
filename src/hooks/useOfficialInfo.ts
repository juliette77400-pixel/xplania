// Official information for one country, read by the official-sources function
// from France Diplomatie and Institut Pasteur pages. Each section says whether
// its page was really read, with the page's own update date.
import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SafetyCategory = "normal" | "reinforced" | "avoid_unless_essential" | "formally_advised_against" | "not_stated";
export type OfficialSourceKey = "security" | "entry" | "contacts" | "health";

export interface OfficialSource {
  key: OfficialSourceKey;
  label: string;
  url: string;
  ok: boolean;
  updatedAt: string | null;
}

export interface OfficialContent {
  safety: {
    category: SafetyCategory;
    published_label: string;
    summary: string;
    zones: Array<{ name: string; category: SafetyCategory }>;
    key_points: string[];
  };
  entry: { short_stay: string; long_stay: string; documents: string[]; other: string[] };
  health: {
    entry_requirements: Array<{ item: string; detail: string }>;
    routine: Array<{ item: string; detail: string }>;
    stay: Array<{ item: string; detail: string }>;
    conditional: Array<{ item: string; condition: string }>;
    malaria: string;
  };
  emergency: Array<{ label: string; number: string }>;
  consulate: { name: string; address: string; phone: string };
}

export interface OfficialResult {
  status: "verified" | "partial" | "unavailable";
  reason?: string;
  fromCache?: boolean;
  changed?: boolean;
  fetchedAt: string;
  lastVerifiedAt?: string | null;
  sources: OfficialSource[];
  content: OfficialContent | null;
}

const unavailable = (reason: string): OfficialResult => ({
  status: "unavailable", reason, fetchedAt: new Date().toISOString(), sources: [], content: null,
});

async function fetchOfficial(countryCode: string, locale: "fr" | "en", force: boolean): Promise<OfficialResult> {
  const { data, error } = await supabase.functions.invoke("official-sources", { body: { countryCode, locale, force } });
  if (error) {
    const status = (error as { context?: { status?: number } })?.context?.status;
    return unavailable(status === 402 ? "quota" : status === 401 ? "auth" : "error");
  }
  if (!data || typeof data !== "object") return unavailable("error");
  return data as OfficialResult;
}

export function sourceOf(result: OfficialResult | null | undefined, key: OfficialSourceKey): OfficialSource | null {
  const s = result?.sources?.find((x) => x.key === key);
  return s && s.ok && result?.content ? s : null;
}

export function useOfficialInfo(countryCode: string | undefined, locale: "fr" | "en") {
  const qc = useQueryClient();
  const key = ["official-sources", countryCode, locale];
  const [refreshing, setRefreshing] = useState(false);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchOfficial(countryCode!, locale, false),
    enabled: !!countryCode,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  /** Opens the official pages again now and keeps the result. */
  const refresh = useCallback(async () => {
    if (!countryCode) return null;
    setRefreshing(true);
    try {
      const fresh = await fetchOfficial(countryCode, locale, true);
      qc.setQueryData(key, fresh);
      return fresh;
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, locale, qc]);

  return { data: query.data ?? null, loading: query.isLoading, refreshing, refresh };
}
