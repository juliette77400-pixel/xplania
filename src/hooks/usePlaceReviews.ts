import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface PlaceReview {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
  author?: { display_name: string | null; avatar_url: string | null };
}

const LOCAL_VOICE_THRESHOLD = 5;

export function usePlaceReviews(placeId: string | null) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("place_reviews")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) console.error(error);
    const list = (data as any[]) || [];
    // fetch author profiles
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
    setReviews(list as PlaceReview[]);
    setLoading(false);
  }, [placeId]);

  useEffect(() => {
    if (placeId) load();
    else setReviews([]);
  }, [placeId, load]);

  const checkLocalVoiceBadge = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("place_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) < LOCAL_VOICE_THRESHOLD) return;

    // Check if badge already unlocked (reuse mood_badges table for cross-feature badges)
    const { data: existing } = await supabase
      .from("mood_badges")
      .select("id")
      .eq("user_id", user.id)
      .eq("code", "local_voice")
      .maybeSingle();
    if (existing) return;

    const { error } = await supabase.from("mood_badges").insert({
      user_id: user.id,
      code: "local_voice",
      name: "Local Voice",
      description: "5 avis publiés sur des lieux découverts",
      icon: "🎙️",
    });
    if (!error) {
      toast.success("🎙️ Badge débloqué : Local Voice", {
        description: "Tu as partagé 5 avis avec la communauté !",
      });
    }
  }, [user]);

  const submit = useCallback(
    async (rating: number, comment: string, photoFile: File | null) => {
      if (!user || !placeId) {
        toast.error("Connecte-toi pour publier un avis");
        return false;
      }
      if (rating < 1 || rating > 5) {
        toast.error("Note invalide");
        return false;
      }
      setSubmitting(true);
      try {
        let photo_url: string | null = null;
        if (photoFile) {
          if (photoFile.size > 5 * 1024 * 1024) {
            toast.error("Photo trop lourde (max 5 Mo)");
            setSubmitting(false);
            return false;
          }
          const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${user.id}/${placeId}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("place-reviews")
            .upload(path, photoFile, { upsert: false, contentType: photoFile.type });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("place-reviews").getPublicUrl(path);
          photo_url = pub.publicUrl;
        }
        const { error } = await supabase.from("place_reviews").insert({
          user_id: user.id,
          place_id: placeId,
          rating,
          comment: comment.trim() || null,
          photo_url,
        });
        if (error) throw error;
        toast.success("Merci pour ton avis ✨");
        await load();
        await checkLocalVoiceBadge();
        return true;
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Impossible de publier l'avis");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [user, placeId, load, checkLocalVoiceBadge],
  );

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  return { reviews, loading, submitting, submit, userReview, reload: load };
}
