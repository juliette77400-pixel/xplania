import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Trip {
  id: string;
  destination: string | null;
  cover_url?: string | null;
}

const cache = new Map<string, string>();
type CoverMode = "unsplash" | "ai";

const invokeJournalCover = async (destination: string, mode: CoverMode) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { data: null, error: new Error("Not authenticated") };
  }

  return supabase.functions.invoke("journal-cover", {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: { destination, mode },
  });
};

export const useJournalCover = (tripId: string, destination: string | null) => {
  const [cover, setCover] = useState<string | null>(cache.get(tripId) || null);

  useEffect(() => {
    if (!tripId || !destination) return;
    if (cache.has(tripId)) {
      setCover(cache.get(tripId)!);
      return;
    }
    let cancelled = false;
    (async () => {
      // Check journals.cover_url first
      const { data: j } = await supabase
        .from("journals")
        .select("cover_url")
        .eq("trip_id", tripId)
        .maybeSingle();
      if (j?.cover_url) {
        cache.set(tripId, j.cover_url);
        if (!cancelled) setCover(j.cover_url);
        return;
      }
      const { data, error } = await invokeJournalCover(destination, "unsplash");
      if (cancelled || error) return;
      const url = (data as any)?.url || null;
      if (url) {
        cache.set(tripId, url);
        setCover(url);
        // Persist on journal row if it exists
        await supabase
          .from("journals")
          .update({ cover_url: url, cover_source: "unsplash" })
          .eq("trip_id", tripId);
      }
    })();
    return () => { cancelled = true; };
  }, [tripId, destination]);

  const regenerate = async (mode: CoverMode = "ai") => {
    if (!destination) return;
    const { data, error } = await invokeJournalCover(destination, mode);
    if (error) return;
    const url = (data as any)?.url;
    if (url) {
      cache.set(tripId, url);
      setCover(url);
      await supabase
        .from("journals")
        .update({ cover_url: url, cover_source: mode })
        .eq("trip_id", tripId);
    }
  };

  return { cover, regenerate };
};
