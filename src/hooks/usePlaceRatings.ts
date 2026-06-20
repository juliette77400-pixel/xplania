import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface PlaceRating {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  tags: string[];
  comment: string | null;
  created_at: string;
  updated_at: string;
  author?: { display_name: string | null; avatar_url: string | null };
}

export const RATING_TAGS = [
  "authentic",
  "cozy",
  "view",
  "foodie",
  "hidden_gem",
  "family",
  "romantic",
  "instagram",
  "budget",
  "scenic",
] as const;
export type RatingTag = (typeof RATING_TAGS)[number];

export function usePlaceRatings(placeId: string | null) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<PlaceRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("place_ratings")
      .select("*")
      .eq("place_id", placeId)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) console.error(error);
    const list = ((data as any[]) || []).map((r) => ({
      ...r,
      tags: Array.isArray(r.tags) ? r.tags : [],
    })) as PlaceRating[];
    const userIds = Array.from(new Set(list.map((r) => r.user_id)));
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      list.forEach((r) => {
        const p = map.get(r.user_id);
        r.author = { display_name: p?.display_name ?? null, avatar_url: p?.avatar_url ?? null };
      });
    }
    setRatings(list);
    setLoading(false);
  }, [placeId]);

  useEffect(() => {
    if (placeId) load();
    else setRatings([]);
  }, [placeId, load]);

  const submit = useCallback(
    async (rating: number, tags: string[], comment: string) => {
      if (!user || !placeId) {
        toast.error("Connecte-toi pour noter ce lieu");
        return false;
      }
      if (rating < 1 || rating > 5) {
        toast.error("Note invalide");
        return false;
      }
      setSubmitting(true);
      try {
        const cleanTags = Array.from(new Set(tags.filter((t) => RATING_TAGS.includes(t as RatingTag)))).slice(0, 6);
        const { error } = await supabase
          .from("place_ratings")
          .upsert(
            {
              user_id: user.id,
              place_id: placeId,
              rating,
              tags: cleanTags,
              comment: comment.trim() ? comment.trim().slice(0, 500) : null,
            },
            { onConflict: "place_id,user_id" },
          );
        if (error) throw error;
        await load();
        return true;
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Impossible d'enregistrer la note");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [user, placeId, load],
  );

  const remove = useCallback(async () => {
    if (!user || !placeId) return false;
    const { error } = await supabase
      .from("place_ratings")
      .delete()
      .eq("place_id", placeId)
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    await load();
    return true;
  }, [user, placeId, load]);

  const userRating = user ? ratings.find((r) => r.user_id === user.id) ?? null : null;
  const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;

  return { ratings, loading, submitting, submit, remove, userRating, avg, reload: load };
}
