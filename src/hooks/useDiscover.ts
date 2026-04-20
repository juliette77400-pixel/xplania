import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { CATEGORIES, DiscoverCategory, distanceKm, timeOfDay } from "@/lib/discover";

export interface Place {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  lat: number;
  lng: number;
  description: string | null;
  why_fits: string | null;
  tags: string[];
  image_url: string | null;
  address: string | null;
  tips: string | null;
  hidden_gem: boolean;
  score: number;
  rating_avg: number;
  rating_count: number;
  distance_km?: number;
}

export function useDiscover() {
  const { position, permission } = useGeolocation({ enabled: true, precision: "balanced" });
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<string | null>(null);
  const enrichingRef = useRef(false);

  const userPos = position ? { lat: position.lat, lng: position.lng } : null;

  // Fetch weather context
  useEffect(() => {
    if (!userPos) return;
    supabase.functions.invoke("weather", { body: { lat: userPos.lat, lon: userPos.lng } })
      .then(({ data }) => { if (data?.weather?.[0]?.main) setWeather(data.weather[0].main); })
      .catch(() => {});
  }, [userPos?.lat, userPos?.lng]);

  const seed = useCallback(async (category: DiscoverCategory | "all" = "all") => {
    if (!userPos) return;
    await supabase.functions.invoke("discover-osm", { body: { lat: userPos.lat, lng: userPos.lng, radius: 1500, category } });
  }, [userPos]);

  const refresh = useCallback(async () => {
    if (!userPos) return;
    setLoading(true);
    try {
      // Seed once for around-you
      await seed("all");
      // Fetch local bbox (~3km)
      const dLat = 3000 / 111000;
      const dLng = 3000 / (111000 * Math.cos((userPos.lat * Math.PI) / 180));
      const { data } = await supabase
        .from("places")
        .select("*")
        .gte("lat", userPos.lat - dLat).lte("lat", userPos.lat + dLat)
        .gte("lng", userPos.lng - dLng).lte("lng", userPos.lng + dLng)
        .order("score", { ascending: false })
        .limit(120);
      const withDist = (data || []).map((p: any) => ({ ...p, distance_km: distanceKm(userPos, { lat: p.lat, lng: p.lng }) }));
      setPlaces(withDist);

      // Enrich up to 12 missing why_fits
      const missing = withDist.filter((p) => !p.why_fits).slice(0, 12).map((p) => p.id);
      if (missing.length && !enrichingRef.current) {
        enrichingRef.current = true;
        supabase.functions.invoke("discover-enrich", { body: { placeIds: missing, contextHint: `${timeOfDay()}, météo: ${weather || "n/a"}` } })
          .then(async () => {
            const { data: refreshed } = await supabase.from("places").select("*").in("id", missing);
            if (refreshed) {
              setPlaces((prev) => prev.map((p) => {
                const u = refreshed.find((r: any) => r.id === p.id);
                return u ? { ...p, ...u, distance_km: p.distance_km } : p;
              }));
            }
          })
          .finally(() => { enrichingRef.current = false; });
      }
    } finally {
      setLoading(false);
    }
  }, [userPos, seed, weather]);

  useEffect(() => { if (userPos) refresh(); }, [userPos?.lat, userPos?.lng]);

  // Sections — "For You" combines time-of-day intent + diversity, with a
  // fallback to top-scored nearby places so the section is NEVER empty when
  // we have data.
  const sections = useMemo(() => {
    const sorted = [...places].sort((a, b) => (a.distance_km ?? 99) - (b.distance_km ?? 99));
    const tod = timeOfDay();

    const intentMatch = (p: Place) => {
      if (tod === "morning") {
        return p.category === "food" || p.category === "chill" ||
          p.tags.some((t) => ["brunch", "café", "cafe", "breakfast", "bakery"].includes(t.toLowerCase()));
      }
      if (tod === "evening" || tod === "night") {
        return p.category === "nightlife" || p.category === "food" ||
          p.tags.some((t) => ["sunset", "rooftop", "bar", "wine"].includes(t.toLowerCase()));
      }
      // afternoon
      return p.category === "culture" || p.category === "experience" || p.category === "nature";
    };

    let forYou = sorted.filter(intentMatch).slice(0, 12);
    // Fallback: if intent filter is too strict, fill with top-scored nearby + diversity.
    if (forYou.length < 6 && sorted.length > 0) {
      const seen = new Set(forYou.map((p) => p.id));
      const seenCats = new Set(forYou.map((p) => p.category));
      // 1) Add hidden gems first
      for (const p of sorted) {
        if (forYou.length >= 12) break;
        if (!seen.has(p.id) && p.hidden_gem) { forYou.push(p); seen.add(p.id); seenCats.add(p.category); }
      }
      // 2) Add diversity by category
      for (const p of sorted) {
        if (forYou.length >= 12) break;
        if (!seen.has(p.id) && !seenCats.has(p.category)) { forYou.push(p); seen.add(p.id); seenCats.add(p.category); }
      }
      // 3) Backfill with top scored
      const topScored = [...sorted].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      for (const p of topScored) {
        if (forYou.length >= 12) break;
        if (!seen.has(p.id)) { forYou.push(p); seen.add(p.id); }
      }
    }

    return {
      forYou,
      around: sorted.slice(0, 12),
      hidden: sorted.filter((p) => p.hidden_gem).slice(0, 12),
      food: sorted.filter((p) => p.category === "food").slice(0, 12),
      experiences: sorted.filter((p) => p.category === "culture" || p.category === "experience").slice(0, 12),
      chill: sorted.filter((p) => p.category === "nature" || p.category === "chill").slice(0, 12),
    };
  }, [places]);

  return { userPos, permission, places, sections, loading, weather, refresh };
}
