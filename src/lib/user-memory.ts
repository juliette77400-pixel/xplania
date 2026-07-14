// Xplania brain (client): track user reactions and manage user memory.
// Persists to `user_recommendations_history` and `user_memory` via Supabase.

import { supabase } from "@/integrations/supabase/client";

export type ItemType = "place" | "destination" | "experience" | "mood_place";

export interface TrackReactionInput {
  itemKey: string;                 // stable identifier — place/destination name or slug
  itemType: ItemType;
  source: string;                  // 'mood-explorer' | 'discover' | ...
  liked?: boolean | null;          // true = liked, false = disliked, null = neutral / just shown
  tags?: string[];                 // optional tags to enrich user_memory likes/dislikes
  context?: Record<string, unknown>;
}

/**
 * Record a reaction on a recommended item and, when tags are provided,
 * update the user memory (likes/dislikes) accordingly.
 */
export async function trackReaction(input: TrackReactionInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  const { itemKey, itemType, source, liked = null, tags = [], context = {} } = input;

  try {
    // Upsert into recommendations history
    const { error: hErr } = await supabase
      .from("user_recommendations_history")
      .upsert(
        {
          user_id: user.id,
          item_key: itemKey,
          item_type: itemType,
          source,
          shown: true,
          liked,
          context,
        },
        { onConflict: "user_id,item_key,item_type" },
      );
    if (hErr) console.error("trackReaction history error", hErr);

    // Update user memory when we have tags and a clear signal
    if (tags.length > 0 && liked !== null) {
      const { data: mem } = await supabase
        .from("user_memory")
        .select("likes, dislikes")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentLikes = new Set(mem?.likes ?? []);
      const currentDislikes = new Set(mem?.dislikes ?? []);
      for (const t of tags) {
        const tag = t.toLowerCase().trim();
        if (!tag) continue;
        if (liked) {
          currentLikes.add(tag);
          currentDislikes.delete(tag);
        } else {
          currentDislikes.add(tag);
          currentLikes.delete(tag);
        }
      }

      const { error: mErr } = await supabase
        .from("user_memory")
        .upsert(
          {
            user_id: user.id,
            likes: Array.from(currentLikes).slice(0, 40),
            dislikes: Array.from(currentDislikes).slice(0, 40),
          },
          { onConflict: "user_id" },
        );
      if (mErr) console.error("trackReaction memory error", mErr);
    }
  } catch (e) {
    console.error("trackReaction exception", e);
  }
}

export async function saveExperience(item: {
  key: string;
  type: ItemType;
  label?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;
  try {
    const { data: mem } = await supabase
      .from("user_memory")
      .select("saved_experiences")
      .eq("user_id", user.id)
      .maybeSingle();
    const list = Array.isArray(mem?.saved_experiences) ? [...(mem?.saved_experiences as any[])] : [];
    if (!list.some((x) => x?.key === item.key && x?.type === item.type)) {
      list.unshift({ ...item, saved_at: new Date().toISOString() });
    }
    const { error } = await supabase
      .from("user_memory")
      .upsert(
        { user_id: user.id, saved_experiences: list.slice(0, 100) },
        { onConflict: "user_id" },
      );
    if (error) console.error("saveExperience error", error);
  } catch (e) {
    console.error("saveExperience exception", e);
  }
}
