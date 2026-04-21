import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
    if (!OPENWEATHER_API_KEY) {
      throw new Error("OPENWEATHER_API_KEY is not configured");
    }

    const { city, lat, lon } = await req.json();

    let url: string;
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${OPENWEATHER_API_KEY}`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=fr&appid=${OPENWEATHER_API_KEY}`;
    } else {
      throw new Error("city or lat/lon required");
    }

    const weatherRes = await fetch(url);
    const data = await weatherRes.json();

    if (!weatherRes.ok) {
      // City not found or other API error → return graceful fallback (200) so the UI doesn't crash.
      console.warn(`OpenWeather ${weatherRes.status}:`, data);
      return new Response(
        JSON.stringify({
          fallback: true,
          error: weatherRes.status === 404 ? "city_not_found" : `api_error_${weatherRes.status}`,
          advice: ["Vérifie la météo manuellement avant ton départ"],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const wind = Math.round(data.wind.speed * 3.6); // m/s → km/h
    const conditions = data.weather?.[0]?.description || "—";
    const icon = data.weather?.[0]?.icon || "01d";

    // Generate smart advice based on conditions
    const advice: string[] = [];
    if (temp < 15) advice.push("Prévois des vêtements chauds : températures fraîches prévues");
    if (temp >= 15 && temp < 22) advice.push("Prévois un pull léger : nuits fraîches possibles");
    if (temp >= 30) advice.push("Hydrate-toi régulièrement : fortes chaleurs prévues");
    if (humidity > 70) advice.push("Privilégie des vêtements respirants : humidité élevée");
    if (wind > 30) advice.push("Prévois une veste coupe-vent : vent soutenu prévu");
    if (conditions.includes("pluie") || conditions.includes("averses")) {
      advice.push("Prévois un imperméable : pluie attendue");
    }
    if (conditions.includes("neige")) {
      advice.push("Prévois des bottes imperméables et des couches chaudes");
    }
    if (conditions.includes("nuageux") || conditions.includes("couvert")) {
      advice.push("Temps variable : prévois des couches superposables");
    }
    if (advice.length === 0) {
      advice.push("Conditions clémentes : vêtements légers recommandés");
    }

    return new Response(
      JSON.stringify({
        temperature: `${temp}°C`,
        feelsLike: `${feelsLike}°C`,
        humidity: `${humidity}%`,
        wind: `${wind} km/h`,
        conditions,
        icon,
        advice,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Weather API error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
