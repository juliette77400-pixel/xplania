/**
 * Helpers d'images sans clé API.
 * Utilise Picsum (placeholders fiables) avec un seed déterministe basé sur les mots-clés,
 * car l'API source.unsplash.com a été dépréciée fin 2024 et renvoie souvent des erreurs.
 */

const sanitize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ,-]/g, "")
    .trim()
    .toLowerCase();

/** Hash simple et stable pour générer un seed numérique à partir d'une chaîne. */
const hashSeed = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString();
};

/** Image principale (hero) pour une destination — déterministe par destination. */
export const heroImage = (destination: string, w = 1600, h = 600) => {
  const seed = hashSeed(sanitize(destination) || "travel");
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
};

/** Vignette pour une activité ou un lieu donné. */
export const activityImage = (
  destination: string,
  query: string,
  w = 400,
  h = 240,
) => {
  const seed = hashSeed(`${sanitize(destination)}-${sanitize(query)}` || "place");
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
};

/** Petite vignette carrée pour un lieu/recommandation. */
export const placeThumbnail = (destination: string, query: string, size = 200) =>
  activityImage(destination, query, size, size);
