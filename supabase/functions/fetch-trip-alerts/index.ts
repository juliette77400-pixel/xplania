import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Official, government-curated travel-advisory sources. We DO NOT scrape them — we link
// out so the user can read the authoritative latest version themselves.
const SECURITY_SOURCES = {
  fr: {
    label: "France Diplomatie — Conseils aux voyageurs",
    base: "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/conseils-par-pays-destination/",
  },
  en: {
    label: "U.S. Department of State — Travel Advisories",
    base: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html",
  },
};

interface AlertInput {
  category: "weather" | "climate" | "security" | "events" | "activities" | "transport";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  source?: string;
  source_url?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;
  const __rl = checkRateLimit({ key: "fetch-trip-alerts", subject: __auth.userId, limit: 30, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const tripId: string | undefined = body?.tripId;
    const destination: string = (body?.destination || "").toString().trim();
    const countryCode: string | undefined = body?.countryCode;
    const locale: "fr" | "en" = body?.locale === "en" ? "en" : "fr";
    const lat: number | undefined = body?.lat;
    const lng: number | undefined = body?.lng;

    if (!tripId || !destination) {
      return new Response(JSON.stringify({ error: "tripId and destination are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify trip ownership
    const { data: trip } = await userClient
      .from("trips")
      .select("id, user_id, departure_date, return_date")
      .eq("id", tripId)
      .maybeSingle();
    if (!trip) {
      return new Response(JSON.stringify({ error: "trip not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alerts: AlertInput[] = [];

    // --- 1. Weather alert (OpenWeather) ---
    const OW = Deno.env.get("OPENWEATHER_API_KEY");
    if (OW) {
      const wxUrl =
        lat && lng
          ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&lang=${locale}&appid=${OW}`
          : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)}&units=metric&lang=${locale}&appid=${OW}`;
      try {
        const wxRes = await fetch(wxUrl);
        if (wxRes.ok) {
          const wx = await wxRes.json();
          const main = wx.weather?.[0]?.main?.toLowerCase() || "";
          const desc = wx.weather?.[0]?.description || "";
          const temp = Math.round(wx.main?.temp ?? 0);
          const wind = Math.round((wx.wind?.speed ?? 0) * 3.6);
          let severity: AlertInput["severity"] = "info";
          if (["thunderstorm", "tornado"].includes(main) || wind > 60 || temp >= 38 || temp <= -10) severity = "critical";
          else if (["rain", "snow", "extreme"].includes(main) || wind > 40 || temp >= 33 || temp <= 0) severity = "warning";

          alerts.push({
            category: "weather",
            severity,
            title: locale === "en" ? `Weather in ${destination}` : `Météo à ${destination}`,
            message:
              locale === "en"
                ? `Currently ${temp}°C — ${desc}. Wind ${wind} km/h.`
                : `Actuellement ${temp}°C — ${desc}. Vent ${wind} km/h.`,
            source: "OpenWeather",
            source_url: "https://openweathermap.org/",
            metadata: { temp, wind, main },
          });
        }
      } catch (e) {
        console.warn("weather fetch failed", e);
      }
    }

    // --- 2. Local events & activities (Gemini, neutral tone) ---
    const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE) {
      try {
        const prompt =
          locale === "en"
            ? `For travelers currently in ${destination}, list up to 3 noteworthy local events, festivals, or seasonal activities happening in the next 7 days. Respond strictly via the "alerts" tool. Keep titles factual and tone neutral. Severity must be "info" unless safety is involved.`
            : `Pour des voyageurs actuellement à ${destination}, liste jusqu'à 3 événements, festivals ou activités saisonnières notables dans les 7 prochains jours. Réponds uniquement via le tool "alerts". Titres factuels, ton neutre. Sévérité "info" sauf enjeu de sécurité.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: locale === "en" ? "You output structured travel alerts." : "Tu produis des alertes voyage structurées." },
              { role: "user", content: prompt },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "alerts",
                  description: "Return a list of trip alerts.",
                  parameters: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            category: { type: "string", enum: ["events", "activities"] },
                            severity: { type: "string", enum: ["info", "warning"] },
                            title: { type: "string" },
                            message: { type: "string" },
                          },
                          required: ["category", "severity", "title", "message"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["items"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "alerts" } },
          }),
        });
        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const call = aiJson.choices?.[0]?.message?.tool_calls?.[0];
          const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
          const items = Array.isArray(args?.items) ? args.items : [];
          for (const it of items.slice(0, 3)) {
            alerts.push({
              category: it.category,
              severity: it.severity || "info",
              title: it.title,
              message: it.message,
              source: "Lovable AI",
            });
          }
        }
      } catch (e) {
        console.warn("ai alerts failed", e);
      }
    }

    // --- 3. Security / conflict alert: official link only, no scraping ---
    const secSource = SECURITY_SOURCES[locale];
    alerts.push({
      category: "security",
      severity: "info",
      title:
        locale === "en"
          ? `Official travel advisory for ${destination}`
          : `Conseils officiels pour ${destination}`,
      message:
        locale === "en"
          ? `For up-to-date safety, security and health information about ${destination}, check the official source below. We do not summarise this content because it changes frequently.`
          : `Pour des informations à jour de sécurité, santé et conseils sur ${destination}, consulte la source officielle ci-dessous. Nous ne la résumons pas car elle évolue souvent.`,
      source: secSource.label,
      source_url: secSource.base,
      link: secSource.base,
    });

    // --- Persist (upsert-ish: avoid duplicates by deleting non-dismissed today's batch first) ---
    const since = new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString();
    await supabase
      .from("trip_alerts")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .gte("created_at", since)
      .eq("dismissed", false);

    const rows = alerts.map((a) => ({
      trip_id: tripId,
      user_id: userId,
      category: a.category,
      severity: a.severity,
      title: a.title,
      message: a.message,
      source: a.source ?? null,
      source_url: a.source_url ?? null,
      link: a.link ?? null,
      metadata: a.metadata ?? {},
    }));

    if (rows.length) {
      const { error: insErr } = await supabase.from("trip_alerts").insert(rows);
      if (insErr) console.error("insert alerts error", insErr);
    }

    // Email notification (Resend) for warning/critical, if user subscribed
    try {
      const { data: sub } = await supabase
        .from("alert_subscriptions")
        .select("channels, categories, email, min_severity")
        .eq("user_id", userId)
        .eq("trip_id", tripId)
        .maybeSingle();
      const RESEND = Deno.env.get("RESEND_API_KEY");
      if (sub && RESEND && sub.channels?.includes("email") && sub.email) {
        const sevRank = { info: 0, warning: 1, critical: 2 } as const;
        const min = sevRank[sub.min_severity as keyof typeof sevRank] ?? 1;
        const toSend = alerts.filter(
          (a) =>
            sub.categories?.includes(a.category) &&
            (sevRank[a.severity] ?? 0) >= min
        );
        if (toSend.length > 0) {
          const html = `
            <h2>${locale === "en" ? "Travel alerts" : "Alertes voyage"} — ${destination}</h2>
            <ul>
              ${toSend
                .map(
                  (a) =>
                    `<li><strong>[${a.severity.toUpperCase()}] ${a.title}</strong><br/>${a.message}${
                      a.link ? `<br/><a href="${a.link}">${a.source || a.link}</a>` : ""
                    }</li>`
                )
                .join("")}
            </ul>
            <p style="font-size:12px;color:#888">${
              locale === "en"
                ? "Transactional alert from Xplania. You receive this because you subscribed to alerts for this trip."
                : "Alerte transactionnelle Xplania. Tu reçois ce message car tu es abonné aux alertes de ce voyage."
            }</p>
          `;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Xplania <onboarding@resend.dev>",
              to: [sub.email],
              subject:
                locale === "en"
                  ? `Travel alerts — ${destination}`
                  : `Alertes voyage — ${destination}`,
              html,
            }),
          });
        }
      }
    } catch (e) {
      console.warn("email send failed", e);
    }

    return new Response(JSON.stringify({ ok: true, count: rows.length, alerts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("fetch-trip-alerts error", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
