import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Haversine distance in meters
function distMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "unauthorized" }, 401);
    const userId = claims.claims.sub;

    const { claim_id } = await req.json();
    if (!claim_id) return json({ error: "missing_claim_id" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: claim, error: cErr } = await admin
      .from("gam_badge_claims")
      .select("*, gam_badges(*)")
      .eq("id", claim_id)
      .maybeSingle();
    if (cErr || !claim) return json({ error: "claim_not_found" }, 404);
    if (claim.user_id !== userId) return json({ error: "forbidden" }, 403);
    if (claim.status === "validated" || claim.status === "rejected") {
      return json({ status: claim.status, already: true });
    }

    const badge = (claim as any).gam_badges;

    // ─── Load admin verification settings (with safe defaults) ───
    const { data: settingsRow } = await admin
      .from("gam_verification_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    const settings = {
      geo_auto_validate: settingsRow?.geo_auto_validate ?? true,
      exif_auto_validate: settingsRow?.exif_auto_validate ?? true,
      ai_auto_validate_threshold: Number(settingsRow?.ai_auto_validate_threshold ?? 0.7),
      ai_auto_reject_threshold: Number(settingsRow?.ai_auto_reject_threshold ?? 0.8),
      force_manual_review: settingsRow?.force_manual_review ?? false,
    };

    const analysis: any = { steps: [], settings, started_at: new Date().toISOString() };
    let verdict: "validated" | "submitted" | "rejected" = "submitted";

    // ─── 1) GEO check ───
    if (claim.geo_lat != null && claim.geo_lng != null && badge.target_lat != null && badge.target_lng != null) {
      const d = distMeters(claim.geo_lat, claim.geo_lng, badge.target_lat, badge.target_lng);
      const radius = badge.target_radius_m ?? 500;
      const within = d <= radius;
      analysis.steps.push({ kind: "geo", distance_m: Math.round(d), radius_m: radius, ok: within });
      if (within && settings.geo_auto_validate && !settings.force_manual_review) verdict = "validated";
    }

    // ─── 2) PHOTO EXIF (signed URL → fetch → parse GPS) ───
    if (verdict !== "validated" && claim.proof_type === "photo" && claim.proof_url) {
      try {
        const { data: signed } = await admin.storage
          .from("badge-proofs")
          .createSignedUrl(claim.proof_url, 120);
        if (signed?.signedUrl) {
          const buf = new Uint8Array(await (await fetch(signed.signedUrl)).arrayBuffer());
          const gps = extractExifGps(buf);
          if (gps && badge.target_lat != null && badge.target_lng != null) {
            const d = distMeters(gps.lat, gps.lng, badge.target_lat, badge.target_lng);
            const radius = badge.target_radius_m ?? 500;
            const within = d <= radius;
            analysis.steps.push({ kind: "exif", lat: gps.lat, lng: gps.lng, distance_m: Math.round(d), radius_m: radius, ok: within });
            if (within && settings.exif_auto_validate && !settings.force_manual_review) verdict = "validated";
          } else {
            analysis.steps.push({ kind: "exif", ok: false, reason: gps ? "no_target" : "no_gps" });
          }
        }
      } catch (e) {
        analysis.steps.push({ kind: "exif", ok: false, error: String(e) });
      }
    }

    // ─── 3) AI TICKET / PHOTO analysis (Gemini multimodal) ───
    if (verdict !== "validated" && (claim.proof_type === "ticket" || claim.proof_type === "photo") && claim.proof_url) {
      try {
        const { data: signed } = await admin.storage
          .from("badge-proofs")
          .createSignedUrl(claim.proof_url, 120);
        if (signed?.signedUrl) {
          const buf = await (await fetch(signed.signedUrl)).arrayBuffer();
          const b64 = base64Encode(new Uint8Array(buf));
          const prompt = `You verify travel badge claims. Badge: "${badge.name_fr}" — ${badge.description_fr}. Target place: ${badge.target_place || "(unspecified)"}.
Analyze this ${claim.proof_type === "ticket" ? "ticket/receipt" : "photo"} and decide if it convincingly proves the user is/was at the target place.
Reply STRICTLY as compact JSON: {"verdict":"validated|rejected|uncertain","confidence":0..1,"reason":"short"}.`;

          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": LOVABLE_API_KEY,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` } },
                ],
              }],
            }),
          });
          if (aiRes.ok) {
            const aiJson = await aiRes.json();
            const txt = aiJson?.choices?.[0]?.message?.content || "";
            const match = txt.match(/\{[\s\S]*\}/);
            const parsed = match ? safeParse(match[0]) : null;
            analysis.steps.push({
              kind: "ai",
              raw: txt.slice(0, 400),
              parsed,
              thresholds: {
                validate: settings.ai_auto_validate_threshold,
                reject: settings.ai_auto_reject_threshold,
              },
            });
            if (!settings.force_manual_review) {
              if (parsed?.verdict === "validated" && (parsed.confidence ?? 0) >= settings.ai_auto_validate_threshold) {
                verdict = "validated";
              } else if (parsed?.verdict === "rejected" && (parsed.confidence ?? 0) >= settings.ai_auto_reject_threshold) {
                verdict = "rejected";
              }
            }
          } else {
            analysis.steps.push({ kind: "ai", ok: false, status: aiRes.status, body: (await aiRes.text()).slice(0, 200) });
          }
        }
      } catch (e) {
        analysis.steps.push({ kind: "ai", ok: false, error: String(e) });
      }
    }

    analysis.finished_at = new Date().toISOString();
    analysis.verdict = verdict;

    // ─── Persist ───
    const update: any = {
      ai_analysis: analysis,
      status: verdict,
    };
    if (verdict === "validated" || verdict === "rejected") {
      update.reviewed_at = new Date().toISOString();
      update.reviewed_by = null; // auto
      if (verdict === "rejected") update.review_reason = "Auto: échec vérification automatique";
    }

    const { error: uErr } = await admin
      .from("gam_badge_claims")
      .update(update)
      .eq("id", claim_id);
    if (uErr) return json({ error: uErr.message }, 500);

    return json({ status: verdict, analysis });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

// ── tiny EXIF GPS parser (JPEG only) ──
function extractExifGps(buf: Uint8Array): { lat: number; lng: number } | null {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const size = (buf[i + 2] << 8) | buf[i + 3];
    if (marker === 0xe1) {
      // APP1 → EXIF
      const start = i + 4;
      if (
        buf[start] === 0x45 && buf[start + 1] === 0x78 && buf[start + 2] === 0x69 &&
        buf[start + 3] === 0x66 && buf[start + 4] === 0x00 && buf[start + 5] === 0x00
      ) {
        return parseTiff(buf.subarray(start + 6, i + 2 + size));
      }
    }
    i += 2 + size;
  }
  return null;
}

function parseTiff(t: Uint8Array): { lat: number; lng: number } | null {
  try {
    const le = t[0] === 0x49;
    const u16 = (o: number) => (le ? t[o] | (t[o + 1] << 8) : (t[o] << 8) | t[o + 1]);
    const u32 = (o: number) =>
      le
        ? (t[o] | (t[o + 1] << 8) | (t[o + 2] << 16) | (t[o + 3] << 24)) >>> 0
        : ((t[o] << 24) | (t[o + 1] << 16) | (t[o + 2] << 8) | t[o + 3]) >>> 0;
    const ifd0 = u32(4);
    const numEntries = u16(ifd0);
    let gpsIfdOffset = 0;
    for (let i = 0; i < numEntries; i++) {
      const eo = ifd0 + 2 + i * 12;
      const tag = u16(eo);
      if (tag === 0x8825) {
        gpsIfdOffset = u32(eo + 8);
        break;
      }
    }
    if (!gpsIfdOffset) return null;
    const n = u16(gpsIfdOffset);
    let latRef = "N", lngRef = "E";
    let latArr: number[] = [], lngArr: number[] = [];
    for (let i = 0; i < n; i++) {
      const eo = gpsIfdOffset + 2 + i * 12;
      const tag = u16(eo);
      const type = u16(eo + 2);
      const count = u32(eo + 4);
      const valOff = u32(eo + 8);
      if (tag === 1) latRef = String.fromCharCode(t[eo + 8]);
      else if (tag === 3) lngRef = String.fromCharCode(t[eo + 8]);
      else if ((tag === 2 || tag === 4) && type === 5 && count === 3) {
        const arr: number[] = [];
        for (let k = 0; k < 3; k++) {
          const num = u32(valOff + k * 8);
          const den = u32(valOff + k * 8 + 4);
          arr.push(den ? num / den : 0);
        }
        if (tag === 2) latArr = arr; else lngArr = arr;
      }
    }
    if (latArr.length !== 3 || lngArr.length !== 3) return null;
    let lat = latArr[0] + latArr[1] / 60 + latArr[2] / 3600;
    let lng = lngArr[0] + lngArr[1] / 60 + lngArr[2] / 3600;
    if (latRef === "S") lat = -lat;
    if (lngRef === "W") lng = -lng;
    return { lat, lng };
  } catch {
    return null;
  }
}

function base64Encode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return null; } }
