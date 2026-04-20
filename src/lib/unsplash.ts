/**
 * Helpers d'images contextuelles.
 *
 * Stratégie :
 *  1. Unsplash via edge function `unsplash` (vraies photos pertinentes)
 *  2. Wikipedia REST API (`/page/summary`) pour monuments / villes connues
 *  3. Fallback final : Picsum déterministe (jamais cassé)
 *
 * Cache mémoire pour éviter les appels répétés.
 */

import { supabase } from "@/integrations/supabase/client";

const sanitize = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const hashSeed = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString();
};

const picsum = (key: string, w: number, h: number) =>
  `https://picsum.photos/seed/${hashSeed(key || "travel")}/${w}/${h}`;

// ─── Caches ──────────────────────────────────────────────────────────────
const wikiCache = new Map<string, Promise<string | null>>();
const unsplashCache = new Map<string, Promise<string | null>>();

// ─── Wikipedia ──────────────────────────────────────────────────────────
const fetchWikipediaImage = (term: string): Promise<string | null> => {
  const key = sanitize(term).toLowerCase();
  if (!key) return Promise.resolve(null);
  if (wikiCache.has(key)) return wikiCache.get(key)!;

  const promise = (async () => {
    const langs = ["fr", "en"];
    for (const lang of langs) {
      try {
        const title = encodeURIComponent(sanitize(term).replace(/\s+/g, "_"));
        const res = await fetch(
          `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok) continue;
        const data = await res.json();
        const url: string | undefined =
          data?.originalimage?.source || data?.thumbnail?.source;
        if (url) return url;
      } catch {
        /* ignore */
      }
    }
    return null;
  })();

  wikiCache.set(key, promise);
  return promise;
};

// ─── Unsplash via edge function ──────────────────────────────────────────
export const fetchUnsplashImage = (query: string): Promise<string | null> => {
  const key = sanitize(query).toLowerCase();
  if (!key) return Promise.resolve(null);
  if (unsplashCache.has(key)) return unsplashCache.get(key)!;

  const promise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("unsplash", {
        body: { query, perPage: 3 },
      });
      if (error || !data?.photos?.length) return null;
      // Pick a stable photo (first result is usually the most relevant).
      return data.photos[0].url || data.photos[0].fullUrl || null;
    } catch {
      return null;
    }
  })();

  unsplashCache.set(key, promise);
  return promise;
};

/** Batch helper — résout plusieurs queries en parallèle. */
export const fetchUnsplashImages = async (
  queries: string[],
): Promise<(string | null)[]> => {
  return Promise.all(queries.map((q) => fetchUnsplashImage(q)));
};

// ─── Synchronous fallbacks (Picsum) ─────────────────────────────────────
export const heroImage = (destination: string, w = 1600, h = 600) =>
  picsum(`hero-${sanitize(destination).toLowerCase()}`, w, h);

export const activityImage = (
  destination: string,
  query: string,
  w = 400,
  h = 240,
) => picsum(`${sanitize(destination)}-${sanitize(query)}`.toLowerCase(), w, h);

export const placeThumbnail = (destination: string, query: string, size = 200) =>
  activityImage(destination, query, size, size);

// ─── Async resolvers (Unsplash → Wikipedia → null) ──────────────────────
/** Résout une vraie image pour une destination. Unsplash d'abord, Wikipedia en fallback. */
export const resolveDestinationImage = async (
  destination: string,
): Promise<string | null> => {
  if (!destination) return null;
  const unsplash = await fetchUnsplashImage(`${destination} travel landscape`);
  if (unsplash) return unsplash;
  return fetchWikipediaImage(destination);
};

/** Résout une vraie image pour un lieu/activité dans une destination. */
export const resolvePlaceImage = async (
  destination: string,
  query: string,
): Promise<string | null> => {
  const candidates = [
    `${query} ${destination}`,
    query,
  ].filter((s) => sanitize(s).length > 1);
  // Try Unsplash first for each candidate
  for (const c of candidates) {
    const img = await fetchUnsplashImage(c);
    if (img) return img;
  }
  // Wikipedia fallback for monuments / famous places
  for (const c of candidates) {
    const img = await fetchWikipediaImage(c);
    if (img) return img;
  }
  return null;
};
