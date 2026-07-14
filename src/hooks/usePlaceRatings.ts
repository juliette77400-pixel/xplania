import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

export const placeRatingsQueryKey = (placeId: string | null, userId: string | undefined) =>
  ["place_ratings", placeId, userId] as const;

export function usePlaceRatings(placeId: string | null) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: placeRatingsQueryKey(placeId, user?.id),
    enabled: !!placeId,
    queryFn: async () => {
      // Public listing via RPC — does NOT expose user_id of other raters.
      const { data, error } = await supabase.rpc("list_place_ratings_public", { _place_id: placeId! });
      if (error) console.error(error);
      const list = ((data as any[]) || []).map((r) => ({
        id: r.id,
        place_id: r.place_id,
        user_id: "",
        rating: r.rating,
        tags: Array.isArray(r.tags) ? r.tags : [],
        comment: r.comment,
        created_at: r.created_at,
        updated_at: r.updated_at,
        author: { display_name: r.author_display_name ?? null, avatar_url: r.author_avatar_url ?? null },
      })) as PlaceRating[];

      // Fetch the current user's own rating separately (full row) so we can
      // detect/edit/delete it without leaking other users' identifiers.
      if (user) {
        const { data: mine } = await supabase
          .from("place_ratings")
          .select("*")
          .eq("place_id", placeId!)
          .eq("user_id", user.id)
          .maybeSingle();
        if (mine) {
          const idx = list.findIndex((r) => r.id === (mine as any).id);
          const own: PlaceRating = {
            ...(mine as any),
            tags: Array.isArray((mine as any).tags) ? (mine as any).tags : [],
            author: idx >= 0 ? list[idx].author : undefined,
          };
          if (idx >= 0) list[idx] = own;
          else list.unshift(own);
        }
      }
      return list;
    },
  });

  const ratings = data ?? [];

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
        await refetch();
        return true;
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Impossible d'enregistrer la note");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [user, placeId, refetch],
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
    await refetch();
    return true;
  }, [user, placeId, refetch]);

  const userRating = user ? ratings.find((r) => r.user_id === user.id) ?? null : null;
  const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;

  return {
    ratings,
    loading: placeId ? isLoading : false,
    submitting,
    submit,
    remove,
    userRating,
    avg,
    reload: refetch,
  };
}
