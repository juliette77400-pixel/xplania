import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { enforceQuota } from "../_shared/quota-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;

  const __rl = checkRateLimit({ key: "discover-search", subject: __auth.userId, limit: 30, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;

  const __quota = await enforceQuota("discover", req, corsHeaders);
  if (__quota) return __quota;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { query, lat, lng, radius = 3000 } = await req.json();
    if (!query) return new Response(JSON.stringify({ error: "query required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // 1. Convert NL query to filters via AI
    const tool = {
      type: "function",
      function: {
        name: "extract_filters",
        description: "Extrait des filtres depuis une requête en langage naturel",
        parameters: {
          type: "object",
          properties: {
            categories: { type: "array", items: { type: "string", enum: ["food", "nightlife", "culture", "nature", "chill", "experience"] } },
            tags: { type: "array", items: { type: "string" } },
            hidden_gem: { type: "boolean" },
            min_rating: { type: "number" },
          },
          required: ["categories", "tags"],
          additionalProperties: false,
        },
      },
    };
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Convertis la requête utilisateur en filtres de recherche de lieux. Tags doivent être des mots-clés lifestyle simples (vue, brunch, calme, romantique, local, hidden, work, sunset...)." },
          { role: "user", content: query },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "extract_filters" } },
      }),
    });
    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA insuffisants" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI failed");
    }
    const aiData = await aiResp.json();
    const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const filters = args ? JSON.parse(args) : { categories: [], tags: [] };

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let q = supa.from("places").select("id,name,category,subcategory,lat,lng,tags,address,image_url,description,why_fits,tips,hidden_gem,score,rating_avg,rating_count");
    if (filters.categories?.length) q = q.in("category", filters.categories);
    if (filters.tags?.length) q = q.overlaps("tags", filters.tags);
    if (filters.hidden_gem) q = q.eq("hidden_gem", true);

    // Bounding box filter approx
    if (typeof lat === "number" && typeof lng === "number") {
      const dLat = radius / 111000;
      const dLng = radius / (111000 * Math.cos((lat * Math.PI) / 180));
      q = q.gte("lat", lat - dLat).lte("lat", lat + dLat).gte("lng", lng - dLng).lte("lng", lng + dLng);
    }
    q = q.order("score", { ascending: false }).limit(40);

    const { data, error } = await q;
    if (error) throw error;

    return new Response(JSON.stringify({ filters, places: data ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("discover-search", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
