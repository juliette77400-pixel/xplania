import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/require-auth.ts";
import { enforceQuota } from "../_shared/quota-guard.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { generateJson, aiErrorResponse } from "../_shared/ai-json.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const rl = rateLimitResponse(checkRateLimit({ key: "valise-missing", subject: auth.userId, limit: 10, windowMs: 60_000 }), corsHeaders);
  if (rl) return rl;
  const quota = await enforceQuota("valise", req, corsHeaders);
  if (quota) return quota;

  try {
    const { destination = "", days = 7, tripTypes = [], activities = [], luggage = "", transport = "", departureDate = "", items = [], locale = "fr" } = await req.json();
    const isEN = String(locale).startsWith("en");
    const list = (items as string[]).slice(0, 200).join(" | ");

    const instructions = `You are a packing expert. Compare the traveler's current packing list with what this specific trip needs (destination climate and season for the dates, local customs, trip type, planned activities, duration, luggage mode and transport rules).
Return what is MISSING only (never an item already in the list, even phrased differently).
- "essential": items truly needed (documents, adapters, health, weather protection, mandatory gear). Max 6.
- "secondary": nice-to-have extras (e.g. one more t-shirt, a spare bag). Max 6.
Each item: short name (max 6 words) and one short reason tied to this trip. Write in ${isEN ? "ENGLISH" : "FRENCH (tutoiement)"}.`;
    const input = `Destination: ${destination}
Dates: ${departureDate || "n/a"} (${days} days)
Trip types: ${(tripTypes as string[]).join(", ") || "n/a"}
Activities: ${(activities as string[]).join(", ") || "n/a"}
Luggage mode: ${luggage || "n/a"} · Transport: ${transport || "n/a"}
Current list: ${list || "empty"}`;

    const it = { type: "object", properties: { item: { type: "string" }, reason: { type: "string" } }, required: ["item", "reason"], additionalProperties: false };
    const schema = {
      type: "object",
      properties: { essential: { type: "array", items: it }, secondary: { type: "array", items: it } },
      required: ["essential", "secondary"],
      additionalProperties: false,
    };
    const out = await generateJson({ instructions, input, schema, name: "missing_items", strict: true });
    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const r = aiErrorResponse(e, corsHeaders);
    if (r) return r;
    console.error("valise-missing error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
