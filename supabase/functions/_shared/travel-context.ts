// Shared helper: build a rich, personalized travel context from the user's
// traveler profile, memory, and recent recommendations history.
// Used by mood-recommend, discover-*, travel-recommendations, etc.

// deno-lint-ignore-file no-explicit-any

export type TravelContext = {
  profile: {
    badge: string | null;
    top_dimensions: Array<{ key: string; score: number }>;
    all_scores: Record<string, number>;
  } | null;
  memory: {
    likes: string[];
    dislikes: string[];
    preferences: Record<string, unknown>;
  };
  history: {
    liked: string[];
    disliked: string[];
    shown_recent: string[];
  };
  recent_moods: string[];
};

const DIM_KEYS = [
  "culture_score",
  "adventure_score",
  "nature_score",
  "comfort_score",
  "budget_score",
  "food_score",
  "authenticity_score",
  "social_score",
  "wellbeing_score",
  "nomad_score",
  "luxury_score",
  "organization_score",
];

export async function buildTravelContext(
  supabase: any,
  userId: string,
): Promise<TravelContext> {
  const ctx: TravelContext = {
    profile: null,
    memory: { likes: [], dislikes: [], preferences: {} },
    history: { liked: [], disliked: [], shown_recent: [] },
    recent_moods: [],
  };

  try {
    // Profile
    const { data: profile } = await supabase
      .from("traveler_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (profile) {
      const scores: Record<string, number> = {};
      for (const k of DIM_KEYS) scores[k.replace("_score", "")] = profile[k] ?? 0;
      const top = Object.entries(scores)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(([key, score]) => ({ key, score: score as number }));
      ctx.profile = {
        badge: profile.badge ?? null,
        top_dimensions: top,
        all_scores: scores,
      };
    }

    // Memory
    const { data: memory } = await supabase
      .from("user_memory")
      .select("likes, dislikes, preferences")
      .eq("user_id", userId)
      .maybeSingle();
    if (memory) {
      ctx.memory.likes = memory.likes ?? [];
      ctx.memory.dislikes = memory.dislikes ?? [];
      ctx.memory.preferences = memory.preferences ?? {};
    }

    // History (last 60)
    const { data: history } = await supabase
      .from("user_recommendations_history")
      .select("item_key, liked, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);
    if (history) {
      for (const h of history) {
        if (h.liked === true) ctx.history.liked.push(h.item_key);
        else if (h.liked === false) ctx.history.disliked.push(h.item_key);
        else ctx.history.shown_recent.push(h.item_key);
      }
    }

    // Recent moods
    const { data: moods } = await supabase
      .from("mood_selections")
      .select("mood")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (moods) ctx.recent_moods = moods.map((m: any) => m.mood).filter(Boolean);
  } catch (e) {
    console.error("buildTravelContext error:", e);
  }

  return ctx;
}

/**
 * Compact prompt snippet to inject into a system/user prompt.
 * Keep it short: LLMs work better with dense, structured context.
 */
export function contextToPromptSnippet(ctx: TravelContext, locale: "fr" | "en" = "fr"): string {
  const isEN = locale === "en";
  const lines: string[] = [];

  if (ctx.profile) {
    const top = ctx.profile.top_dimensions
      .map((d) => `${d.key}(${d.score})`)
      .join(", ");
    lines.push(
      isEN
        ? `Traveler profile: ${ctx.profile.badge ?? "unknown"}. Top dimensions: ${top}.`
        : `Profil voyageur : ${ctx.profile.badge ?? "inconnu"}. Dimensions dominantes : ${top}.`,
    );
  }
  if (ctx.memory.likes.length) {
    lines.push(
      isEN
        ? `Likes: ${ctx.memory.likes.slice(0, 10).join(", ")}.`
        : `Aime : ${ctx.memory.likes.slice(0, 10).join(", ")}.`,
    );
  }
  if (ctx.memory.dislikes.length) {
    lines.push(
      isEN
        ? `Dislikes (avoid): ${ctx.memory.dislikes.slice(0, 10).join(", ")}.`
        : `N'aime pas (évite) : ${ctx.memory.dislikes.slice(0, 10).join(", ")}.`,
    );
  }
  if (ctx.history.liked.length) {
    lines.push(
      isEN
        ? `Previously liked: ${ctx.history.liked.slice(0, 8).join(", ")}.`
        : `Déjà appréciés : ${ctx.history.liked.slice(0, 8).join(", ")}.`,
    );
  }
  if (ctx.history.disliked.length) {
    lines.push(
      isEN
        ? `Rejected — do NOT re-suggest: ${ctx.history.disliked.slice(0, 10).join(", ")}.`
        : `Rejetés — NE PAS reproposer : ${ctx.history.disliked.slice(0, 10).join(", ")}.`,
    );
  }
  if (ctx.history.shown_recent.length) {
    lines.push(
      isEN
        ? `Recently shown (prefer new suggestions): ${ctx.history.shown_recent.slice(0, 12).join(", ")}.`
        : `Déjà proposés récemment (privilégie du nouveau) : ${ctx.history.shown_recent.slice(0, 12).join(", ")}.`,
    );
  }
  if (ctx.recent_moods.length) {
    lines.push(
      isEN
        ? `Recent moods: ${ctx.recent_moods.join(", ")}.`
        : `Moods récents : ${ctx.recent_moods.join(", ")}.`,
    );
  }

  if (!lines.length) {
    return isEN
      ? "No prior traveler context available yet."
      : "Aucun contexte voyageur préalable disponible.";
  }
  return (isEN ? "== XPLANIA TRAVEL CONTEXT ==\n" : "== CONTEXTE VOYAGEUR XPLANIA ==\n") +
    lines.join("\n");
}

/**
 * Record shown recommendations to avoid re-proposing the same items later.
 * Upsert on (user_id, item_key, item_type) — updates `shown=true` and refreshes updated_at.
 */
export async function recordShownRecommendations(
  supabase: any,
  userId: string,
  items: Array<{ item_key: string; item_type: string; source: string; context?: Record<string, unknown> }>,
): Promise<void> {
  if (!items.length) return;
  try {
    const rows = items.map((i) => ({
      user_id: userId,
      item_key: i.item_key,
      item_type: i.item_type,
      source: i.source,
      shown: true,
      context: i.context ?? {},
    }));
    const { error } = await supabase
      .from("user_recommendations_history")
      .upsert(rows, { onConflict: "user_id,item_key,item_type", ignoreDuplicates: false });
    if (error) console.error("recordShownRecommendations error:", error);
  } catch (e) {
    console.error("recordShownRecommendations exception:", e);
  }
}
