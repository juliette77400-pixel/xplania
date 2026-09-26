// Google Places (New) proxy — authenticated, rate-limited, cached.
// actions:
//  - "details": { name, lat?, lng? } -> best-matching place with rating, hours, photo
//  - "search":  { query, lat?, lng? } -> up to 8 places (for "add a place" pickers)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const CACHE_DAYS = 14;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function locationBias(lat?: number, lng?: number, radius = 5000) {
  if (typeof lat !== "number" || typeof lng !== "number" || !isFinite(lat) || !isFinite(lng)) return undefined;
  return { circle: { center: { latitude: lat, longitude: lng }, radius } };
}

async function gateway(path: string, init: RequestInit & { fieldMask?: string }) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY_1") ?? Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) throw new Error("Missing Google Maps connector credentials");
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
      "Content-Type": "application/json",
      ...(init.fieldMask ? { "X-Goog-FieldMask": init.fieldMask } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Google gateway [${res.status}]: ${body}`);
    throw Object.assign(new Error(`google_${res.status}`), { status: res.status, body });
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const rl = checkRateLimit({ key: "google-places", subject: auth.userId, limit: 40, windowMs: 60_000 });
  const rlResp = rateLimitResponse(rl, corsHeaders);
  if (rlResp) return rlResp;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const action = body?.action;
  const lat = typeof body?.lat === "number" ? body.lat : undefined;
  const lng = typeof body?.lng === "number" ? body.lng : undefined;
  const lang = body?.lang === "en" ? "en" : "fr";

  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    if (action === "search") {
      const query = String(body?.query ?? "").trim().slice(0, 120);
      if (query.length < 2) return json({ results: [] });
      const data = await gateway("/places/v1/places:searchText", {
        method: "POST",
        fieldMask: "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.primaryTypeDisplayName",
        body: JSON.stringify({ textQuery: query, pageSize: 8, languageCode: lang, locationBias: locationBias(lat, lng, 30000) }),
      });
      const results = (data.places ?? []).map((p: any) => ({
        google_place_id: p.id,
        name: p.displayName?.text ?? "",
        address: p.formattedAddress ?? null,
        lat: p.location?.latitude,
        lng: p.location?.longitude,
        rating: p.rating ?? null,
        type: p.primaryTypeDisplayName?.text ?? null,
      })).filter((r: any) => typeof r.lat === "number");
      return json({ results });
    }

    if (action === "details") {
      const name = String(body?.name ?? "").trim().slice(0, 120);
      if (name.length < 2) return json({ error: "name_required" }, 400);
      const key = `d:${lang}:${name.toLowerCase()}:${lat?.toFixed(3) ?? "x"}:${lng?.toFixed(3) ?? "x"}`;

      const { data: cached } = await supa.from("google_place_cache").select("payload,fetched_at").eq("cache_key", key).maybeSingle();
      if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_DAYS * 86400_000) {
        return json({ place: cached.payload, cached: true });
      }

      const data = await gateway("/places/v1/places:searchText", {
        method: "POST",
        fieldMask: [
          "places.id", "places.displayName", "places.formattedAddress", "places.location", "places.rating",
          "places.userRatingCount", "places.googleMapsUri", "places.websiteUri", "places.nationalPhoneNumber",
          "places.currentOpeningHours.openNow", "places.regularOpeningHours.weekdayDescriptions",
          "places.priceLevel", "places.primaryTypeDisplayName", "places.photos",
        ].join(","),
        body: JSON.stringify({ textQuery: name, pageSize: 1, languageCode: lang, locationBias: locationBias(lat, lng, 3000) }),
      });
      const p = data.places?.[0];
      if (!p) return json({ place: null });

      let photo_uri: string | null = null;
      let photo_attribution: string | null = null;
      const photo = p.photos?.[0];
      if (photo?.name) {
        try {
          const media = await gateway(`/places/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`, { method: "GET" });
          photo_uri = media.photoUri ?? null;
          photo_attribution = photo.authorAttributions?.[0]?.displayName ?? null;
        } catch (_) { /* optional */ }
      }

      const place = {
        google_place_id: p.id,
        name: p.displayName?.text ?? name,
        address: p.formattedAddress ?? null,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        rating: p.rating ?? null,
        rating_count: p.userRatingCount ?? null,
        maps_uri: p.googleMapsUri ?? null,
        website: p.websiteUri ?? null,
        phone: p.nationalPhoneNumber ?? null,
        open_now: p.currentOpeningHours?.openNow ?? null,
        hours: p.regularOpeningHours?.weekdayDescriptions ?? [],
        price_level: p.priceLevel ?? null,
        type: p.primaryTypeDisplayName?.text ?? null,
        photo_uri,
        photo_attribution,
      };
      await supa.from("google_place_cache").upsert({ cache_key: key, payload: place, fetched_at: new Date().toISOString() });
      return json({ place });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e: any) {
    if (e?.status === 403) return json({ error: "google_denied", details: e.body }, 403);
    if (e?.status) return json({ error: "google_error", status: e.status, details: e.body }, e.status);
    console.error(e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
