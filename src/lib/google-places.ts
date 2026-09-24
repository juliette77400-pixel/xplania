import { useQuery } from "@tanstack/react-query";
import i18n from "@/i18n";
import { invokeProtectedFunction } from "@/lib/protected-functions";

export interface GooglePlaceDetails {
  google_place_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  rating_count: number | null;
  maps_uri: string | null;
  website: string | null;
  phone: string | null;
  open_now: boolean | null;
  hours: string[];
  price_level: string | null;
  type: string | null;
  photo_uri: string | null;
  photo_attribution: string | null;
}

export interface GoogleSearchResult {
  google_place_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  type: string | null;
}

const lang = () => (i18n.language?.startsWith("en") ? "en" : "fr");

export async function searchGooglePlaces(query: string, near?: { lat: number; lng: number } | null) {
  const { data, error } = await invokeProtectedFunction<{ results: GoogleSearchResult[] }>("google-places", {
    body: { action: "search", query, lat: near?.lat, lng: near?.lng, lang: lang() },
  });
  if (error) throw error;
  return data?.results ?? [];
}

/** Real Google info (rating, hours, photo) for a place, cached server-side for 14 days. */
export function useGooglePlaceDetails(name?: string | null, lat?: number | null, lng?: number | null, enabled = true) {
  return useQuery({
    queryKey: ["google-place", name, lat?.toFixed(3), lng?.toFixed(3), lang()],
    enabled: enabled && !!name && name.length > 1,
    staleTime: 1000 * 60 * 60,
    retry: false,
    queryFn: async () => {
      const { data, error } = await invokeProtectedFunction<{ place: GooglePlaceDetails | null }>("google-places", {
        body: { action: "details", name, lat: lat ?? undefined, lng: lng ?? undefined, lang: lang() },
      });
      if (error) throw error;
      return data?.place ?? null;
    },
  });
}
