import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useStableCoords } from "@/hooks/useStableCallback";
import { distanceKm, timeOfDay, type DiscoverCategory } from "@/lib/discover";
import { fetchUnsplashImage } from "@/lib/unsplash";
import { invokeProtectedFunction } from "@/lib/protected-functions";

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

export const discoverPlacesKey = (lat?: number, lng?: number) =>
  ["discover", "places", lat, lng] as const;
export const discoverWeatherKey = (lat?: number, lng?: number) =>
  ["discover", "weather", lat, lng] as const;

async function fetchInBbox(
  userPos: { lat: number; lng: number },
  radiusM: number,
): Promise<Place[]> {
  const dLat = radiusM / 111000;
  const dLng = radiusM / (111000 * Math.cos((userPos.lat * Math.PI) / 180));
  const { data } = await supabase
    .from("places")
    .select("*")
    .gte("lat", userPos.lat - dLat).lte("lat", userPos.lat + dLat)
    .gte("lng", userPos.lng - dLng).lte("lng", userPos.lng + dLng)
    .order("score", { ascending: false })
    .limit(150);
  return (data || []).map((p: any) => ({
    ...p,
    distance_km: distanceKm(userPos, { lat: p.lat, lng: p.lng }),
  }));
}

export function useDiscover() {
  const { position, permission } = useGeolocation({ enabled: true, precision: "balanced" });
  const userPos = useStableCoords(position ? { lat: position.lat, lng: position.lng } : null, 100);
  const qc = useQueryClient();

  const weatherQuery = useQuery({
    queryKey: discoverWeatherKey(userPos?.lat, userPos?.lng),
    enabled: !!userPos,
    staleTime: 1000 * 60 * 15,
    queryFn: async () => {
      const { data } = await invokeProtectedFunction<{ conditions?: string }>("weather", {
        body: { lat: userPos!.lat, lon: userPos!.lng },
      });
      return data?.conditions ?? null;
    },
  });
  const weather = weatherQuery.data ?? null;

  const placesQuery = useQuery({
    queryKey: discoverPlacesKey(userPos?.lat, userPos?.lng),
    enabled: !!userPos,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const pos = userPos!;
      // Seed once for around-you
      await invokeProtectedFunction("discover-osm", {
        body: { lat: pos.lat, lng: pos.lng, radius: 1500, category: "all" as DiscoverCategory | "all" },
      }).catch(() => {});
      let withDist = await fetchInBbox(pos, 3000);
      if (withDist.length < 8) {
        await invokeProtectedFunction("discover-osm", {
          body: { lat: pos.lat, lng: pos.lng, radius: 5000, category: "all" },
        }).catch(() => {});
        withDist = await fetchInBbox(pos, 8000);
      }
      if (withDist.length < 4) {
        withDist = await fetchInBbox(pos, 20000);
      }
      return withDist;
    },
  });
  const places = useMemo<Place[]>(() => placesQuery.data ?? [], [placesQuery.data]);

  const patchPlaces = useCallback(
    (updater: (prev: Place[]) => Place[]) => {
      qc.setQueryData<Place[]>(discoverPlacesKey(userPos?.lat, userPos?.lng), (prev) =>
        updater(prev ?? []),
      );
    },
    [qc, userPos?.lat, userPos?.lng],
  );

  // Enrich missing why_fits (fire-and-forget mutation).
  const enrichMutation = useMutation({
    mutationFn: async ({ ids, hint }: { ids: string[]; hint: string }) => {
      await invokeProtectedFunction("discover-enrich", { body: { placeIds: ids, contextHint: hint } });
      const { data } = await supabase.from("places").select("*").in("id", ids);
      return data || [];
    },
    onSuccess: (refreshed) => {
      if (!refreshed.length) return;
      patchPlaces((prev) =>
        prev.map((p) => {
          const u = refreshed.find((r: any) => r.id === p.id);
          return u ? ({ ...p, ...u, distance_km: p.distance_km } as Place) : p;
        }),
      );
    },
  });

  // Unsplash image hydration.
  const hydrateImagesMutation = useMutation({
    mutationFn: async (targets: Place[]) => {
      const updates = await Promise.all(
        targets.map(async (p) => {
          const q = `${p.name} ${p.category}`.trim();
          const img = await fetchUnsplashImage(q);
          if (img) {
            await supabase.from("places").update({ image_url: img }).eq("id", p.id);
            return { id: p.id, image_url: img };
          }
          return null;
        }),
      );
      return updates.filter(Boolean) as { id: string; image_url: string }[];
    },
    onSuccess: (valid) => {
      if (!valid.length) return;
      patchPlaces((prev) =>
        prev.map((p) => {
          const u = valid.find((v) => v.id === p.id);
          return u ? { ...p, image_url: u.image_url } : p;
        }),
      );
    },
  });

  // Kick off enrichment + image hydration whenever places load.
  useMemo(() => {
    if (!places.length) return;
    const missing = places.filter((p) => !p.why_fits).slice(0, 12).map((p) => p.id);
    if (missing.length && !enrichMutation.isPending) {
      enrichMutation.mutate({ ids: missing, hint: `${timeOfDay()}, météo: ${weather || "n/a"}` });
    }
    const noImage = places.filter((p) => !p.image_url).slice(0, 16);
    if (noImage.length && !hydrateImagesMutation.isPending) {
      hydrateImagesMutation.mutate(noImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  const refresh = useCallback(async () => {
    await placesQuery.refetch();
  }, [placesQuery]);

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
      return p.category === "culture" || p.category === "experience" || p.category === "nature";
    };

    const forYou = sorted.filter(intentMatch).slice(0, 12);
    if (forYou.length < 6 && sorted.length > 0) {
      const seen = new Set(forYou.map((p) => p.id));
      const seenCats = new Set(forYou.map((p) => p.category));
      for (const p of sorted) {
        if (forYou.length >= 12) break;
        if (!seen.has(p.id) && p.hidden_gem) { forYou.push(p); seen.add(p.id); seenCats.add(p.category); }
      }
      for (const p of sorted) {
        if (forYou.length >= 12) break;
        if (!seen.has(p.id) && !seenCats.has(p.category)) { forYou.push(p); seen.add(p.id); seenCats.add(p.category); }
      }
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

  return {
    userPos,
    permission,
    places,
    sections,
    loading: placesQuery.isLoading || placesQuery.isFetching,
    weather,
    refresh,
  };
}
