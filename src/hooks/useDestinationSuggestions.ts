// Wave 3: destination suggestions powered by traveler profile + originality boost.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DestinationSuggestion {
  slug: string;
  name: string;
  country: string;
  region: string | null;
  lat: number | null;
  lng: number | null;
  hero_image_url: string | null;
  summary: string | null;
  tags: string[];
  best_seasons: string[];
  originality_score: number;
  tourism_mass: number;
  match_score: number;
  match_reason: { profile_match: number; originality: number };
  hidden_gems: Array<{
    name: string;
    kind: string;
    summary: string | null;
    best_season: string | null;
    originality_score: number;
    tags: string[];
  }>;
  curated_notes: Array<{ title: string; content: string; category: string }>;
}

export interface UseDestinationSuggestionsOptions {
  limit?: number;
  originalityBoost?: number;
  locale?: "fr" | "en";
  enabled?: boolean;
}

export function useDestinationSuggestions(opts: UseDestinationSuggestionsOptions = {}) {
  const { user } = useAuth();
  const { limit = 5, originalityBoost = 0.4, locale = "fr", enabled = true } = opts;

  return useQuery({
    queryKey: ["xplania-destinations", user?.id, limit, originalityBoost, locale],
    enabled: !!user && enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("xplania-suggest-destinations", {
        body: { limit, originalityBoost, locale },
      });
      if (error) throw new Error(error.message || "Suggestion failed");
      return (data?.destinations ?? []) as DestinationSuggestion[];
    },
  });
}
