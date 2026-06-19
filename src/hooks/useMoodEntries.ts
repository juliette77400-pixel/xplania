import { useCallback, useEffect, useState } from "react";
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

export function useMoodEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setEntries([]);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("mood_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      console.error(error);
      return;
    }
    setEntries((data as MoodEntry[]) || []);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

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
      setEntries((prev) => [data as MoodEntry, ...prev]);
      return data as MoodEntry;
    },
    [user],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from("mood_entries").delete().eq("id", id);
      if (error) {
        toast.error("Échec de suppression");
        return;
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [],
  );

  return { entries, loading, log, remove, reload: load };
}
