// Leaderboard global — top users by computed XP
// Aggregates explore_nodes (visited), journal_blocks (notes/photos/...),
// mood_favorites (+ hidden_gem) and *_badges, then applies the same
// XP formula as the client (`src/lib/xp-levels.ts`).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const XP = {
  exploreVisited: 20,
  journalNotes: 10,
  journalPhotos: 8,
  journalLocations: 12,
  journalMoods: 15,
  moodFavorites: 10,
  moodHiddenGems: 25,
  badgesTotal: 50,
};

interface Row {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  badges: number;
  visited: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    // Pull all relevant rows (limited dataset → fine for beta).
    const [profiles, nodes, blocks, favs, eb, jb, mb] = await Promise.all([
      sb.from("profiles").select("user_id, display_name, avatar_url").limit(2000),
      sb.from("explore_nodes").select("user_id, status").eq("status", "visited"),
      sb.from("journal_blocks").select("user_id, type"),
      sb.from("mood_favorites").select("user_id, place_id, mood_places!inner(hidden_gem)"),
      sb.from("explore_badges").select("user_id"),
      sb.from("journal_badges").select("user_id"),
      sb.from("mood_badges").select("user_id"),
    ]);

    const stats = new Map<string, {
      visited: number; notes: number; photos: number; locations: number;
      moods: number; favorites: number; hiddenGems: number; badges: number;
    }>();
    const get = (id: string) => {
      let s = stats.get(id);
      if (!s) {
        s = { visited: 0, notes: 0, photos: 0, locations: 0, moods: 0, favorites: 0, hiddenGems: 0, badges: 0 };
        stats.set(id, s);
      }
      return s;
    };

    (nodes.data || []).forEach((n: any) => { get(n.user_id).visited++; });
    (blocks.data || []).forEach((b: any) => {
      const s = get(b.user_id);
      if (b.type === "note") s.notes++;
      else if (b.type === "photo") s.photos++;
      else if (b.type === "location" || b.type === "place") s.locations++;
      else if (b.type === "mood") s.moods++;
    });
    (favs.data || []).forEach((f: any) => {
      const s = get(f.user_id);
      s.favorites++;
      if (f.mood_places?.hidden_gem) s.hiddenGems++;
    });
    [...(eb.data || []), ...(jb.data || []), ...(mb.data || [])].forEach((r: any) => {
      get(r.user_id).badges++;
    });

    const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
    (profiles.data || []).forEach((p: any) => {
      profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url });
    });

    const rows: Row[] = [];
    stats.forEach((s, user_id) => {
      const xp =
        s.visited * XP.exploreVisited +
        s.notes * XP.journalNotes +
        s.photos * XP.journalPhotos +
        s.locations * XP.journalLocations +
        s.moods * XP.journalMoods +
        s.favorites * XP.moodFavorites +
        s.hiddenGems * XP.moodHiddenGems +
        s.badges * XP.badgesTotal;
      if (xp <= 0) return;
      const p = profileMap.get(user_id);
      rows.push({
        user_id,
        display_name: p?.display_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        xp,
        badges: s.badges,
        visited: s.visited,
      });
    });

    rows.sort((a, b) => b.xp - a.xp);

    return new Response(JSON.stringify({ leaderboard: rows.slice(0, 50) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[leaderboard-xp]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
