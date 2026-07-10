// ✨ NEW (Tâche 3) — Duplique un voyage existant en repartant uniquement
// des données de planification (titre + form_data + recommendations + dates).
// Les données vivantes (carnet, GPS, badges, mood favs) ne sont PAS copiées,
// pour donner à l'utilisateur un voyage "propre" à refaire.
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useDuplicateTrip = () => {
  const { user } = useAuth();
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const duplicateTrip = useCallback(
    async (tripId: string): Promise<string | null> => {
      if (!user) {
        toast.error("Connecte-toi pour dupliquer un voyage.");
        return null;
      }
      setDuplicating(tripId);
      try {
        const { data: src, error: srcErr } = await supabase
          .from("trips")
          .select("title,destination,arrival_city,departure_location,departure_date,return_date,duration,form_data,recommendations")
          .eq("id", tripId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (srcErr) throw srcErr;
        if (!src) {
          toast.error("Voyage introuvable.");
          return null;
        }

        const baseTitle = src.title || src.destination || "Voyage";
        const { data: created, error: insErr } = await supabase
          .from("trips")
          .insert({
            user_id: user.id,
            title: `${baseTitle} (copie)`,
            destination: src.destination,
            arrival_city: src.arrival_city,
            departure_location: src.departure_location,
            departure_date: null, // l'utilisateur replanifiera les dates
            return_date: null,
            duration: src.duration,
            form_data: src.form_data,
            recommendations: src.recommendations,
          })
          .select("id")
          .single();
        if (insErr) throw insErr;

        toast.success("Voyage dupliqué — modifie les dates pour le replanifier ✨");
        return created?.id || null;
      } catch (e: any) {
        console.error("[useDuplicateTrip] failed", e);
        toast.error(e?.message || "Impossible de dupliquer ce voyage.");
        return null;
      } finally {
        setDuplicating(null);
      }
    },
    [user]
  );

  return { duplicateTrip, duplicating };
};
