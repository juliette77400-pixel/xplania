// Returns the founder's Google Maps browser key to signed-in users only.
// The key is referrer-restricted to xplania.app in Google Cloud, so it is safe
// to hand to the browser (same exposure as embedding it in the Maps script URL).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/require-auth.ts";

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

  const key = Deno.env.get("GOOGLE_API_KEY");
  if (!key) return json({ error: "maps_key_missing" }, 500);

  return json({ key });
});
