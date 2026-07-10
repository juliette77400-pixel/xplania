import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface MoodEntry {
  id: string;
  user_id: string;
  mood_selection_id: string | null;
  mood_tags: string[];
  satisfaction_rating: number | null;
  note: string | null;
  source: string;
  entry_date: string;
  created_at: string;
}

export interface LogMoodInput {
  mood_tags: string[];
  satisfaction_rating?: number | null;
  note?: string | null;
  mood_selection_id?: string | null;
  source?: string;
}

export const moodEntriesQueryKey = (userId: string | undefined) =>
  ["mood_entries", userId] as const;

export function useMoodEntries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: moodEntriesQueryKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mood_entries")
        .select("*")
        .eq("user_id", user!.id)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        console.error(error);
        return [] as MoodEntry[];
      }
      return (data as MoodEntry[]) || [];
    },
  });

  const log = useCallback(
    async (input: LogMoodInput) => {
      if (!user) {
        toast.error("Connecte-toi pour enregistrer ton humeur");
        return null;
      }
      const payload = {
        user_id: user.id,
        mood_tags: input.mood_tags,
        satisfaction_rating: input.satisfaction_rating ?? null,
        note: input.note ?? null,
        mood_selection_id: input.mood_selection_id ?? null,
        source: input.source ?? "manual",
      };
      const { data, error } = await (supabase as any)
        .from("mood_entries")
        .insert(payload)
        .select("*")
        .single();
      if (error) {
        console.error(error);
        toast.error("Échec d'enregistrement");
        return null;
      }
      // Prepend into the shared cache so every consumer stays in sync.
      queryClient.setQueryData<MoodEntry[]>(moodEntriesQueryKey(user.id), (prev) => [
        data as MoodEntry,
        ...(prev || []),
      ]);
      return data as MoodEntry;
    },
    [user, queryClient],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from("mood_entries").delete().eq("id", id);
      if (error) {
        toast.error("Échec de suppression");
        return;
      }
      queryClient.setQueryData<MoodEntry[]>(moodEntriesQueryKey(user?.id), (prev) =>
        (prev || []).filter((e) => e.id !== id),
      );
    },
    [user, queryClient],
  );

  return {
    entries: data ?? [],
    loading: user ? isLoading : false,
    log,
    remove,
    reload: refetch,
  };
}
