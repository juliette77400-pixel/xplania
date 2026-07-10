// Quick weather lookup by lat/lng using OpenWeatherMap.
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;
  try {
    const { lat, lng, units = "metric", lang = "fr" } = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ error: "lat/lng required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const key = Deno.env.get("OPENWEATHER_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "missing_key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=${units}&lang=${lang}&appid=${key}`);
    if (!r.ok) {
      return new Response(JSON.stringify({ error: "weather_failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const d = await r.json();
    return new Response(JSON.stringify({
      temp: Math.round(d.main?.temp ?? 0),
      condition: d.weather?.[0]?.description || "",
      icon: d.weather?.[0]?.icon || null,
      humidity: d.main?.humidity ?? null,
      wind: d.wind?.speed ?? null,
      city: d.name || null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
