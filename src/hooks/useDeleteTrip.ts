// ✨ NEW (Tâche 1 - Suppression voyage) — cascade silencieuse côté client.
// Supprime un voyage + toutes ses données associées (journal, blocs, jours, stories,
// badges journal, tracking, positions, check-ins, activities, explore_*, mood_favorites
// liés au trip_id). L'ordre respecte les dépendances FK existantes.
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useDeleteTrip = () => {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteTrip = useCallback(
    async (tripId: string): Promise<boolean> => {
      if (!user) {
        toast.error("Tu dois être connecté pour supprimer un voyage.");
        return false;
      }
      setDeleting(tripId);
      try {
        // Vérifie que le user est bien propriétaire (sécurité côté client en plus de RLS).
        const { data: trip, error: ownErr } = await supabase
          .from("trips")
          .select("user_id")
          .eq("id", tripId)
          .maybeSingle();
        if (ownErr) throw ownErr;
        if (!trip || trip.user_id !== user.id) {
          toast.error("Tu ne peux supprimer que tes propres voyages.");
          return false;
        }

        // Récupère les journals liés pour cascader leurs enfants
        const { data: journals } = await supabase
          .from("journals")
          .select("id")
          .eq("trip_id", tripId);
        const journalIds = (journals || []).map((j) => j.id);

        // Cascade silencieuse — on ignore les erreurs individuelles non bloquantes
        // (RLS empêchera de toute façon les accès non autorisés).
        if (journalIds.length > 0) {
          await supabase.from("journal_blocks").delete().in("journal_id", journalIds);
          await supabase.from("journal_days").delete().in("journal_id", journalIds);
          await supabase.from("journal_stories").delete().in("journal_id", journalIds);
          await supabase.from("journal_badges").delete().in("journal_id", journalIds);
        }
        await supabase.from("journals").delete().eq("trip_id", tripId);

        // Tracking (positions, checkins, activities, tracking config)
        await supabase.from("trip_positions").delete().eq("trip_id", tripId);
        await supabase.from("trip_checkins").delete().eq("trip_id", tripId);
        await supabase.from("trip_activities").delete().eq("trip_id", tripId);
        await supabase.from("trip_tracking").delete().eq("trip_id", tripId);

        // Explore graph
        await supabase.from("explore_node_media").delete().eq("trip_id", tripId);
        await supabase.from("explore_edges").delete().eq("trip_id", tripId);
        await supabase.from("explore_badges").delete().eq("trip_id", tripId);
        await supabase.from("explore_progress").delete().eq("trip_id", tripId);
        await supabase.from("explore_nodes").delete().eq("trip_id", tripId);

        // Mood favorites liés à ce voyage
        await supabase.from("mood_favorites").delete().eq("trip_id", tripId);

        // Enfin : le voyage lui-même
        const { error } = await supabase.from("trips").delete().eq("id", tripId);
        if (error) throw error;

        toast.success("Voyage supprimé");
        return true;
      } catch (e: any) {
        console.error("[useDeleteTrip] failed", e);
        toast.error(e?.message || "Impossible de supprimer ce voyage.");
        return false;
      } finally {
        setDeleting(null);
      }
    },
    [user]
  );

  return { deleteTrip, deleting };
};
