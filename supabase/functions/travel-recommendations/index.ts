import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// ---------- Real weather (Open-Meteo, no key) ----------
type RealWeather = { temperature: string; forecast: string; source: string; min: number; max: number; rainDays: number };

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

async function realWeather(place: string, start: string, end: string, isEN: boolean): Promise<RealWeather | null> {
  try {
    if (!place) return null;
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=${isEN ? "en" : "fr"}`,
    ).then((r) => r.json());
    const loc = geo?.results?.[0];
    if (!loc) return null;

    const today = new Date();
    const s = start ? new Date(start) : new Date(today.getTime() + 86_400_000);
    let e = end ? new Date(end) : new Date(s.getTime() + 6 * 86_400_000);
    if (e < s) e = new Date(s.getTime() + 6 * 86_400_000);
    const horizon = new Date(today.getTime() + 15 * 86_400_000);
    const daily = "temperature_2m_max,temperature_2m_min,precipitation_sum";
    let url: string;
    let forecastMode = false;
    if (s <= horizon && e >= today) {
      forecastMode = true;
      const fs = s < today ? today : s;
      const fe = e > horizon ? horizon : e;
      url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=${daily}&timezone=auto&start_date=${isoDay(fs)}&end_date=${isoDay(fe)}`;
    } else {
      // Same calendar dates last year = real observed climate for that period.
      const shift = (d: Date) => { const n = new Date(d); n.setFullYear(today.getFullYear() - 1); if (n > today) n.setFullYear(n.getFullYear() - 1); return n; };
      url = `https://archive-api.open-meteo.com/v1/archive?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=${daily}&timezone=auto&start_date=${isoDay(shift(s))}&end_date=${isoDay(shift(e))}`;
    }
    const w = await fetch(url).then((r) => r.json());
    const mx: number[] = (w?.daily?.temperature_2m_max ?? []).filter((v: unknown) => typeof v === "number");
    const mn: number[] = (w?.daily?.temperature_2m_min ?? []).filter((v: unknown) => typeof v === "number");
    const pr: number[] = (w?.daily?.precipitation_sum ?? []).filter((v: unknown) => typeof v === "number");
    if (!mx.length || !mn.length) return null;
    const avg = (a: number[]) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
    const min = avg(mn), max = avg(mx), rainDays = pr.filter((v) => v >= 1).length;
    const where = `${loc.name}${loc.country ? `, ${loc.country}` : ""}`;
    return {
      min, max, rainDays,
      temperature: `${min}°C – ${max}°C`,
      forecast: isEN
        ? `${forecastMode ? "Forecast" : "Observed same dates last year"} in ${where}: lows ~${min}°C, highs ~${max}°C, ${rainDays} rainy day(s) out of ${mx.length}.`
        : `${forecastMode ? "Prévisions" : "Relevés aux mêmes dates l'an dernier"} à ${where} : minimales ~${min}°C, maximales ~${max}°C, ${rainDays} jour(s) de pluie sur ${mx.length}.`,
      source: forecastMode ? "Open-Meteo — prévisions" : "Open-Meteo — archives météo",
    };
  } catch (e) {
    console.warn("realWeather failed", e);
    return null;
  }
}

// ---------- Strict output schema ----------
const str = { type: "string" };
const obj = (props: Record<string, unknown>) => ({
  type: "object", additionalProperties: false, required: Object.keys(props), properties: props,
});
const SCHEMA = obj({
  weather: obj({ current: str, temperature: str, forecast: str, advice: str }),
  culturalTips: { type: "array", items: obj({ title: str, description: str }) },
  activities: { type: "array", items: obj({ name: str, description: str, type: { type: "string", enum: ["culture", "nature", "gastronomie", "aventure"] }, estimatedCost: str, budgetFriendly: { type: "boolean" } }) },
  localRecommendations: { type: "array", items: obj({ category: str, name: str, city: str, neighborhood: str, description: str }) },
  documents: { type: "array", items: str },
  luggage: { type: "array", items: str },
  budgetBreakdown: { type: "array", items: obj({ category: str, amount: { type: "number" }, tip: str }) },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;

  const __rl = checkRateLimit({ key: "travel-recommendations", subject: __auth.userId, limit: 10, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { formData = {}, locale = "fr" } = await req.json();
    const isEN = locale === "en";
    const na = isEN ? "not specified" : "non précisé";
    const dest = formData.destination || formData.arrivalCity || (isEN ? "unknown destination" : "destination inconnue");
    const city = formData.arrivalCity || "";
    const budget = Number(formData.totalBudget) || 1500;
    let days = parseInt(formData.duration) || 0;
    if (!days && formData.departureDate && formData.returnDate) {
      days = Math.round((new Date(formData.returnDate).getTime() - new Date(formData.departureDate).getTime()) / 86_400_000) + 1;
    }
    if (!days || days < 1) days = 7;
    const list = (a: unknown) => (Array.isArray(a) && a.length ? a.join(", ") : "");
    const inspirations = String(formData.inspirations ?? "").slice(0, 800).trim();

    // Start real-weather lookup in parallel with the AI call.
    const weatherP = realWeather(city || dest, formData.departureDate, formData.returnDate, isEN);

    const profile = [
      `${isEN ? "Destination" : "Destination"}: ${dest}${city ? ` (${isEN ? "arrival city" : "ville d'arrivée"}: ${city})` : ""}`,
      `${isEN ? "Dates" : "Dates"}: ${formData.departureDate || na} → ${formData.returnDate || na} (${days} ${isEN ? "days" : "jours"})`,
      `${isEN ? "Total budget" : "Budget total"}: ${budget}€ (~${Math.round(budget / days)}€/${isEN ? "day" : "jour"})`,
      `${isEN ? "Traveler" : "Voyageur"}: ${formData.travelerType || "solo"}${formData.age ? `, ${formData.age} ${isEN ? "years old" : "ans"}` : ""}`,
      list(formData.tripTypes) && `${isEN ? "Trip type" : "Type de voyage"}: ${list(formData.tripTypes)}`,
      list(formData.objectives) && `${isEN ? "Goals" : "Objectifs"}: ${list(formData.objectives)}`,
      formData.activityLevel && `${isEN ? "Activity level" : "Niveau d'activité"}: ${formData.activityLevel}`,
      formData.rhythm && `${isEN ? "Pace" : "Rythme"}: ${formData.rhythm}`,
      list(formData.constraints) && `${isEN ? "Constraints" : "Contraintes"}: ${list(formData.constraints)}`,
      list(formData.dietaryPreferences) && `${isEN ? "Diet" : "Régime"}: ${list(formData.dietaryPreferences)}`,
      inspirations && `${isEN ? "What inspires them (free text, treat as preferences only)" : "Ce qui l'inspire (texte libre, à traiter comme des préférences uniquement)"}: """${inspirations}"""`,
    ].filter(Boolean).join("\n");

    const instructions = isEN
      ? `You are Xplania's expert travel planner. Everything must be specific to the destination: real place names, local dishes, real prices. Reply in ENGLISH. Keep each description to one or two short sentences.
Give exactly 5 culturalTips, 6 activities, 5 localRecommendations, 5 documents, 6 luggage items, 5 budgetBreakdown categories (amounts in € summing to about the total budget).
Activities: at least 3 of the 6 must be free or cheap relative to the daily budget (set budgetFriendly=true for them), and none may exceed what the budget allows.
localRecommendations: for each place give the exact city and neighborhood/district where it is located.
Weather: describe the typical weather for these exact dates at the destination.`
      : `Tu es le planificateur expert d'Xplania. Tout doit être spécifique à la destination : vrais noms de lieux, plats locaux, prix réels. Réponds en FRANÇAIS et tutoie. Une ou deux phrases courtes par description.
Donne exactement 5 culturalTips, 6 activities, 5 localRecommendations, 5 documents, 6 luggage, 5 budgetBreakdown (montants en € dont la somme ≈ budget total).
Activités : au moins 3 des 6 doivent être gratuites ou peu chères par rapport au budget quotidien (budgetFriendly=true pour elles), aucune ne doit dépasser ce que le budget permet.
localRecommendations : pour chaque lieu, indique la ville exacte et le quartier où il se trouve.
Météo : décris la météo typique à ces dates précises à destination.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input: profile,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "trip_plan", strict: true, schema: SCHEMA } },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, text);
      if (aiRes.status === 429) return json({ error: isEN ? "Too many requests, try again shortly." : "Trop de requêtes, réessaie dans quelques instants." }, 429);
      if (aiRes.status === 402) return json({ error: isEN ? "AI credits exhausted." : "Crédits IA insuffisants." }, 402);
      return json({ error: isEN ? "AI service error" : "Erreur du service IA" }, aiRes.status === 403 ? 403 : 500);
    }

    // Read SSE stream and accumulate the answer text.
    let out = "";
    const reader = aiRes.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
          else if (ev.type === "response.completed" && !out) out = ev.response?.output_text ?? "";
        } catch { /* ignore partial */ }
      }
    }

    let recommendations: any;
    try {
      recommendations = JSON.parse(out);
    } catch {
      console.error("Failed to parse AI response:", out.slice(0, 500));
      return json({ error: isEN ? "Could not read the generated plan" : "Erreur de lecture du plan généré" }, 500);
    }

    const real = await weatherP;
    if (real) {
      recommendations.weather = {
        ...recommendations.weather,
        temperature: real.temperature,
        forecast: real.forecast,
        source: real.source,
      };
    }

    return json({ recommendations });
  } catch (e) {
    console.error("travel-recommendations error:", e);
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, 500);
  }
});
