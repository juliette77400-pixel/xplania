// ✨ NEW (Tâche 3) — Met à jour les champs basiques d'un voyage
// (title, destination, dates). Recalcule la durée si les dates changent.
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface TripUpdatePayload {
  title?: string | null;
  destination?: string | null;
  departure_date?: string | null;
  return_date?: string | null;
}

export const useUpdateTrip = () => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const updateTrip = useCallback(
    async (tripId: string, payload: TripUpdatePayload): Promise<boolean> => {
      if (!user) return false;
      setUpdating(true);
      try {
        const patch: Record<string, any> = { ...payload };
        if (payload.departure_date && payload.return_date) {
          const d1 = new Date(payload.departure_date).getTime();
          const d2 = new Date(payload.return_date).getTime();
          if (!isNaN(d1) && !isNaN(d2) && d2 >= d1) {
            patch.duration = Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
          }
        }
        const { error } = await supabase
          .from("trips")
          .update(patch)
          .eq("id", tripId)
          .eq("user_id", user.id);
        if (error) throw error;
        toast.success("Voyage mis à jour ✨");
        return true;
      } catch (e: any) {
        console.error("[useUpdateTrip] failed", e);
        toast.error(e?.message || "Impossible de mettre à jour ce voyage.");
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [user]
  );

  return { updateTrip, updating };
};
