// ✨ NEW (Tâche 3) — Duplique un voyage existant en repartant uniquement
// des données de planification (titre + form_data + recommendations + dates).
// Les données vivantes (carnet, GPS, badges, mood favs) ne sont PAS copiées,
// pour donner à l'utilisateur un voyage "propre" à refaire.
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import i18n from "@/i18n";

export const useDuplicateTrip = () => {
  const { user } = useAuth();
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const duplicateTrip = useCallback(
    async (tripId: string): Promise<string | null> => {
      if (!user) {
        toast.error(i18n.t("ui2.auto.k3"));
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
          toast.error(i18n.t("ui2.auto.k17"));
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

        toast.success(i18n.language.startsWith("en") ? i18n.t("ui2.useDuplicateTrip.duplicated", { defaultValue: "Trip duplicated — update the dates to reschedule it ✨" }) : "Voyage dupliqué — modifie les dates pour le replanifier ✨");
        return created?.id || null;
      } catch (e: any) {
        console.error("[useDuplicateTrip] failed", e);
        toast.error(e?.message || i18n.t("ui2.auto.k12"));
        return null;
      } finally {
        setDuplicating(null);
      }
    },
    [user]
  );

  return { duplicateTrip, duplicating };
};
