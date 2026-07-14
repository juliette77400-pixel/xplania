import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// One-shot: for each tinder_cards row with no image_url, fetch one from Unsplash
// (using the card's unsplash_query) and update the row via service_role.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH_ACCESS_KEY) throw new Error("UNSPLASH_ACCESS_KEY missing");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cards, error } = await admin
      .from("tinder_cards")
      .select("id, unsplash_query")
      .is("image_url", null)
      .eq("active", true);
    if (error) throw error;

    let updated = 0;
    for (const card of cards ?? []) {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(card.unsplash_query)}&orientation=portrait&per_page=1&content_filter=high`;
      const res = await fetch(url, {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`, "Accept-Version": "v1" },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const photo = json?.results?.[0];
      const image_url = photo?.urls?.regular;
      if (!image_url) continue;
      const { error: upErr } = await admin
        .from("tinder_cards")
        .update({ image_url })
        .eq("id", card.id);
      if (!upErr) updated++;
    }

    return new Response(JSON.stringify({ ok: true, updated, total: cards?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("tinder-seed-images error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
