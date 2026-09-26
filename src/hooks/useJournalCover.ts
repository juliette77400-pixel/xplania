import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const fetchCover = async (tripId: string, destination: string): Promise<string | null> => {
  if (cache.has(tripId)) return cache.get(tripId)!;

  const { data: j } = await supabase
    .from("journals")
    .select("cover_url")
    .eq("trip_id", tripId)
    .maybeSingle();
  if (j?.cover_url) {
    cache.set(tripId, j.cover_url);
    return j.cover_url;
  }

  const { data, error } = await invokeJournalCover(destination, "unsplash");
  if (error) return null;
  const url = (data as any)?.url || null;
  if (url) {
    cache.set(tripId, url);
    await supabase
      .from("journals")
      .update({ cover_url: url, cover_source: "unsplash" })
      .eq("trip_id", tripId);
  }
  return url;
};

export const useJournalCover = (tripId: string, destination: string | null) => {
  const queryClient = useQueryClient();

  const { data: cover } = useQuery({
    queryKey: ["journal-cover", tripId, destination],
    queryFn: () => fetchCover(tripId, destination as string),
    enabled: !!tripId && !!destination,
    initialData: cache.get(tripId) || null,
  });

  const regenerateMutation = useMutation({
    mutationFn: async (mode: CoverMode) => {
      if (!destination) return null;
      const { data, error } = await invokeJournalCover(destination, mode);
      if (error) return null;
      const url = (data as any)?.url || null;
      if (url) {
        cache.set(tripId, url);
        await supabase
          .from("journals")
          .update({ cover_url: url, cover_source: mode })
          .eq("trip_id", tripId);
      }
      return url;
    },
    onSuccess: (url) => {
      if (url) queryClient.setQueryData(["journal-cover", tripId, destination], url);
    },
  });

  const regenerate = async (mode: CoverMode = "ai") => {
    await regenerateMutation.mutateAsync(mode);
  };

  return { cover: cover ?? null, regenerate };
};
