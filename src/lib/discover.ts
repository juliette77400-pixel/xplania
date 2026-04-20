export type DiscoverCategory = "food" | "nightlife" | "culture" | "nature" | "chill" | "experience";

export const CATEGORIES: { key: DiscoverCategory; label: string; emoji: string; color: string }[] = [
  { key: "food", label: "Food & Drinks", emoji: "🍝", color: "hsl(20 90% 55%)" },
  { key: "nightlife", label: "Nightlife", emoji: "🎶", color: "hsl(290 85% 60%)" },
  { key: "culture", label: "Experiences", emoji: "🎭", color: "hsl(45 90% 55%)" },
  { key: "nature", label: "Chill & Nature", emoji: "🌿", color: "hsl(155 70% 45%)" },
  { key: "chill", label: "Cosy spots", emoji: "📚", color: "hsl(220 75% 60%)" },
  { key: "experience", label: "À découvrir", emoji: "✨", color: "hsl(190 90% 55%)" },
];

export const categoryByKey = (k: string) => CATEGORIES.find((c) => c.key === k);

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function timeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h < 6) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  if (h < 23) return "evening";
  return "night";
}
