// Usual temperatures in the student's city for the months of the stay, from
// the observed weather of the same dates one year earlier (Open-Meteo archive).
// No AI, no quota. The browser never talks to the weather provider directly.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const iso = (d: Date) => d.toISOString().slice(0, 10);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const auth = await requireAuth(req, cors);
  if (auth instanceof Response) return auth;
  const rl = rateLimitResponse(checkRateLimit({ key: "climate-months", subject: auth.userId, limit: 20, windowMs: 60_000 }), cors);
  if (rl) return rl;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "invalid_request" }, 400); }
  const city = typeof b.city === "string" ? b.city.trim().slice(0, 80) : "";
  const country = typeof b.countryCode === "string" && /^[A-Za-z]{2}$/.test(b.countryCode) ? b.countryCode.toUpperCase() : "";
  const lang = b.locale === "en" ? "en" : "fr";
  if (city.length < 2) return json({ error: "city_required" }, 400);

  // Stay window: given dates, otherwise the next 3 months. Capped at 12 months.
  const today = new Date();
  let start = isDate(b.start) ? new Date(b.start) : new Date(today.getFullYear(), today.getMonth() + 1, 1);
  let end = isDate(b.end) ? new Date(b.end) : new Date(start.getFullYear(), start.getMonth() + 3, 0);
  if (end < start) end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
  const maxEnd = new Date(start.getFullYear(), start.getMonth() + 12, 0);
  if (end > maxEnd) end = maxEnd;
  const planned = !!(isDate(b.start) && isDate(b.end));

  // Same calendar dates in the most recent past year that is fully observed.
  let shift = 1;
  const yesterday = new Date(today.getTime() - 2 * 86_400_000);
  while (new Date(end.getFullYear() - shift, end.getMonth(), end.getDate()) > yesterday) shift++;
  const pastStart = new Date(start.getFullYear() - shift, start.getMonth(), start.getDate());
  const pastEnd = new Date(end.getFullYear() - shift, end.getMonth(), end.getDate());

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=${lang}${country ? `&countryCode=${country}` : ""}`;
    const geo = await fetch(geoUrl).then((r) => (r.ok ? r.json() : null));
    const place = geo?.results?.[0];
    if (!place) return json({ status: "not_found" });

    const archUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${place.latitude}&longitude=${place.longitude}&start_date=${iso(pastStart)}&end_date=${iso(pastEnd)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const arch = await fetch(archUrl).then((r) => (r.ok ? r.json() : null));
    const days: string[] = arch?.daily?.time || [];
    if (!days.length) return json({ status: "unavailable" });

    const byMonth = new Map<string, { max: number[]; min: number[]; rain: number }>();
    days.forEach((d, i) => {
      const k = d.slice(5, 7); // month number, year-independent
      const m = byMonth.get(k) || { max: [], min: [], rain: 0 };
      const mx = arch.daily.temperature_2m_max[i], mn = arch.daily.temperature_2m_min[i], p = arch.daily.precipitation_sum[i];
      if (typeof mx === "number") m.max.push(mx);
      if (typeof mn === "number") m.min.push(mn);
      if (typeof p === "number" && p >= 1) m.rain++;
      byMonth.set(k, m);
    });
    const avg = (a: number[]) => (a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length) : null);
    const months = [...byMonth.entries()].map(([month, m]) => ({
      month: Number(month), tmax: avg(m.max), tmin: avg(m.min), rainyDays: m.rain, days: m.max.length,
    }));

    return json({
      status: "ok",
      planned,
      place: { name: place.name, region: place.admin1 || "", country: place.country || "" },
      observed: { from: iso(pastStart), to: iso(pastEnd) },
      months,
      source: { name: "Open-Meteo", url: "https://open-meteo.com/" },
    });
  } catch (e) {
    console.error("[climate-months]", e);
    return json({ status: "unavailable" });
  }
});
