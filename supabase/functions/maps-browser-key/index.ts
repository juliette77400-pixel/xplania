// Returns the founder's Google Maps browser key to signed-in users only.
// The key is referrer-restricted to xplania.app in Google Cloud, so it is safe
// to hand to the browser (same exposure as embedding it in the Maps script URL).
//
// Cost guardrail: counts every key delivery per day (one delivery ≈ one map
// load in Google's billing) and stops serving the key after DAILY_LIMIT,
// so the app falls back to the free dark Leaflet map. Hard 0 € guarantee.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { requireAuth } from "../_shared/require-auth.ts";

const DAILY_LIMIT = 200;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const key = Deno.env.get("GOOGLE_MAPS_BROWSER_KEY_1") ?? Deno.env.get("GOOGLE_API_KEY");
  if (!key) return json({ error: "maps_key_missing" }, 500);

  // Atomic per-day counter, service-role only (RLS-locked table).
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await admin.rpc("record_map_load");
    if (!error && typeof data === "number" && data > DAILY_LIMIT) {
      return json({ error: "daily_limit", limit: DAILY_LIMIT, used: data }, 429);
    }
  } catch {
    // Counter failure must never block the map — fail open.
  }

  return json({ key });
});
