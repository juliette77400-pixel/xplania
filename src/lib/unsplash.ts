/**
 * Helpers d'images via Unsplash Source API (sans clé).
 * https://source.unsplash.com/<size>/?<keywords>
 */

const sanitize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ,-]/g, "")
    .trim()
    .replace(/\s+/g, ",");

/** Image principale (hero) pour une destination. */
export const heroImage = (destination: string, w = 1600, h = 600) => {
  const q = sanitize(destination || "travel,landscape");
  return `https://source.unsplash.com/${w}x${h}/?${q},travel,landscape`;
};

/** Vignette pour une activité ou un lieu donné. */
export const activityImage = (
  destination: string,
  query: string,
  w = 400,
  h = 240,
) => {
  const dest = sanitize(destination || "");
  const q = sanitize(query || "city");
  const keywords = [q, dest].filter(Boolean).join(",");
  return `https://source.unsplash.com/${w}x${h}/?${keywords}`;
};

/** Petite vignette carrée pour un lieu/recommandation. */
export const placeThumbnail = (destination: string, query: string, size = 200) =>
  activityImage(destination, query, size, size);
