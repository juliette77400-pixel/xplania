// ✨ NEW — Suivi des tâches "Avant le départ" (passeport, visa, vaccins, assurance, valise)
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const REMINDER_ITEMS = ["passport", "visa", "vaccines", "insurance", "packing"] as const;
export type ReminderItem = (typeof REMINDER_ITEMS)[number];

export const useTripReminderChecks = (tripId: string | undefined) => {
  const { user } = useAuth();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tripId || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("trip_reminder_checks")
      .select("item")
      .eq("trip_id", tripId)
      .eq("user_id", user.id);
    setDone(new Set((data || []).map((r) => r.item)));
    setLoading(false);
  }, [tripId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (item: string, value: boolean) => {
      if (!tripId || !user) return;
      // Optimistic update
      setDone((prev) => {
        const next = new Set(prev);
        if (value) next.add(item);
        else next.delete(item);
        return next;
      });
      if (value) {
        await supabase
          .from("trip_reminder_checks")
          .upsert({ trip_id: tripId, user_id: user.id, item }, { onConflict: "trip_id,item" });
      } else {
        await supabase
          .from("trip_reminder_checks")
          .delete()
          .eq("trip_id", tripId)
          .eq("user_id", user.id)
          .eq("item", item);
      }
    },
    [tripId, user]
  );

  return { done, toggle, loading, allDone: done.size >= REMINDER_ITEMS.length };
};
