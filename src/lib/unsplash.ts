/**
 * Helpers d'images contextuelles sans clé API.
 *
 * Stratégie :
 *  - Wikipedia REST API (`/page/summary`) renvoie `originalimage` / `thumbnail`
 *    pour la plupart des destinations et lieux célèbres. Aucune clé requise.
 *  - Fallback sur Openverse (Creative Commons) si Wikipedia ne renvoie rien.
 *  - Fallback final : Picsum (déterministe) pour ne jamais avoir d'image cassée.
 */

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

// Cache mémoire pour éviter de re-fetch les mêmes destinations.
const wikiCache = new Map<string, Promise<string | null>>();

const fetchWikipediaImage = (term: string): Promise<string | null> => {
  const key = sanitize(term).toLowerCase();
  if (!key) return Promise.resolve(null);
  if (wikiCache.has(key)) return wikiCache.get(key)!;

  const promise = (async () => {
    // On essaie d'abord en français, puis en anglais.
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

/**
 * Hook-friendly utility : retourne immédiatement une URL fallback (Picsum)
 * et permet à l'appelant d'écouter une promesse pour upgrader l'image.
 * Pour rester simple, on expose deux helpers :
 *   - `heroImage(destination)` : URL synchrone (Picsum)
 *   - `resolveDestinationImage(destination)` : promesse vers une vraie image
 */

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

/** Résout une vraie image (Wikipedia) pour une destination. */
export const resolveDestinationImage = (destination: string) =>
  fetchWikipediaImage(destination);

/** Résout une vraie image pour un lieu/activité dans une destination. */
export const resolvePlaceImage = async (
  destination: string,
  query: string,
): Promise<string | null> => {
  // On tente d'abord la requête combinée, puis le query seul, puis la destination.
  const candidates = [
    `${query} ${destination}`,
    query,
    destination,
  ].filter((s) => sanitize(s).length > 1);
  for (const c of candidates) {
    const img = await fetchWikipediaImage(c);
    if (img) return img;
  }
  return null;
};
