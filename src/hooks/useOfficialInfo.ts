import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

// In-memory cache by `${destination}|${locale}` (TTL 30min)
const cache = new Map<string, { data: OfficialInfo; t: number }>();
const TTL = 30 * 60 * 1000;

export function useOfficialInfo(destination: string | undefined, locale: "fr" | "en") {
  const [data, setData] = useState<OfficialInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aborted = useRef(false);

  useEffect(() => {
    aborted.current = false;
    if (!destination || destination.length < 2) {
      setData(null);
      setError(null);
      return;
    }
    const key = `${destination.toLowerCase()}|${locale}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.t < TTL) {
      setData(hit.data);
      return;
    }

    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data: resp, error: err } = await supabase.functions.invoke(
          "visa-official-info",
          { body: { destination, locale } },
        );
        if (aborted.current) return;
        if (err) throw new Error(err.message);
        if (!resp || resp.error) throw new Error(resp?.error || "no_data");
        cache.set(key, { data: resp as OfficialInfo, t: Date.now() });
        setData(resp as OfficialInfo);
      } catch (e) {
        if (aborted.current) return;
        setError(e instanceof Error ? e.message : "error");
      } finally {
        if (!aborted.current) setLoading(false);
      }
    })();

    return () => {
      aborted.current = true;
    };
  }, [destination, locale]);

  return { data, loading, error };
}
