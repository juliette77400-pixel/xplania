import type { ExploreNode } from "@/hooks/useExplore";
import i18n from "@/i18n";

export type BadgeCategory = "exploration" | "food" | "culture" | "social" | "adventure";
export type BadgeRarity = "commun" | "rare" | "épique" | "légendaire";

export interface BadgeDef {
  code: string;
  name: string;
  readonly description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  /** mediaCount + nodes → progress 0..1 */
  progress: (nodes: ExploreNode[], mediaCount: number) => { current: number; target: number };
  check: (nodes: ExploreNode[], mediaCount: number) => boolean;
}

const visited = (n: ExploreNode[]) => n.filter((x) => x.status === "visited");
const byType = (n: ExploreNode[], t: string) => n.filter((x) => x.type === t);
const visitedByType = (n: ExploreNode[], t: string) => n.filter((x) => x.type === t && x.status === "visited");

const mk = (
  code: string,
  name: string,
  descriptionKey: string,
  icon: string,
  category: BadgeCategory,
  rarity: BadgeRarity,
  current: (n: ExploreNode[], m: number) => number,
  target: number,
): BadgeDef => ({
  code,
  name,
  get description() {
    return i18n.t(`ui2.exploreBadges.${descriptionKey}`);
  },
  icon,
  category,
  rarity,
  progress: (n, m) => ({ current: Math.min(current(n, m), target), target }),
  check: (n, m) => current(n, m) >= target,
});

export const EXPLORE_BADGES: BadgeDef[] = [
  // 🧭 EXPLORATION (8)
  mk("explorer", "Explorer", "explorer",  "🧭", "exploration", "commun", (n) => visited(n).length, 1),
  mk("urban_explorer", "Urban Explorer", "urban_explorer",  "🏙️", "exploration", "commun", (n) => visitedByType(n, "place").length, 5),
  mk("globe_trotter", "Globe Trotter", "globe_trotter",  "🌍", "exploration", "rare", (n) => visited(n).length, 10),
  mk("collector", "Map Collector", "collector",  "🗺️", "exploration", "rare", (n) => n.length, 20),
  mk("city_master", "City Master", "city_master",  "👑", "exploration", "épique", (n) => visited(n).length, 8),
  mk("pathfinder", "Pathfinder", "pathfinder",  "🧗", "exploration", "épique", (n) => visited(n).length, 30),
  mk("local_insider", "Local Insider", "local_insider",  "💎", "exploration", "épique", (n) => visited(n).filter((x) => (x.metadata as any)?.hidden_gem).length, 5),
  mk("voyageur_master", "Voyageur Master", "voyageur_master",  "🏆", "exploration", "légendaire", (n) => visited(n).length, 50),

  // 🍽️ FOOD (8)
  mk("foodie", "Foodie", "foodie",  "🍴", "food", "commun", (n) => byType(n, "food").length, 1),
  mk("food_lover", "Food Lover", "food_lover",  "🍝", "food", "commun", (n) => byType(n, "food").length, 5),
  mk("street_food", "Street Food Hunter", "street_food",  "🥡", "food", "rare", (n) => visitedByType(n, "food").length, 3),
  mk("gourmet", "Gourmet", "gourmet",  "🍽️", "food", "rare", (n) => visitedByType(n, "food").length, 10),
  mk("coffee_addict", "Coffee Addict", "coffee_addict",  "☕", "food", "commun", (n) => n.filter((x) => /caf[eé]|coffee/i.test(x.name)).length, 5),
  mk("sweet_tooth", "Sweet Tooth", "sweet_tooth",  "🍰", "food", "commun", (n) => n.filter((x) => /patiss|bakery|dessert|glace|ice/i.test(x.name)).length, 3),
  mk("wine_explorer", "Wine Explorer", "wine_explorer",  "🍷", "food", "rare", (n) => n.filter((x) => /vin|wine|bar/i.test(x.name)).length, 3),
  mk("michelin_dream", "Michelin Dream", "michelin_dream",  "⭐", "food", "légendaire", (n) => visitedByType(n, "food").length, 20),

  // 🏛️ CULTURE (8)
  mk("museum_visitor", "Museum Visitor", "museum_visitor",  "🖼️", "culture", "commun", (n) => visitedByType(n, "culture").length, 1),
  mk("culture_hunter", "Culture Hunter", "culture_hunter",  "🏛️", "culture", "commun", (n) => byType(n, "culture").length, 5),
  mk("art_lover", "Art Lover", "art_lover",  "🎨", "culture", "rare", (n) => visitedByType(n, "culture").length, 5),
  mk("history_buff", "History Buff", "history_buff",  "🏰", "culture", "rare", (n) => n.filter((x) => /monument|histor|chateau|palais|cathedral|temple/i.test(x.name)).length, 5),
  mk("architect_eye", "Architect Eye", "architect_eye",  "🏛️", "culture", "épique", (n) => byType(n, "culture").length, 10),
  mk("show_lover", "Show Lover", "show_lover",  "🎭", "culture", "rare", (n) => n.filter((x) => /concert|spectacle|theatre|opera|show/i.test(x.name)).length, 3),
  mk("photo_journal", "Photo Journal", "photo_journal",  "📸", "culture", "épique", (_n, m) => m, 20),
  mk("culture_master", "Culture Master", "culture_master",  "📚", "culture", "légendaire", (n) => visitedByType(n, "culture").length, 20),

  // 👥 SOCIAL (8)
  mk("memory_keeper", "Memory Keeper", "memory_keeper",  "📷", "social", "commun", (_n, m) => m, 10),
  mk("storyteller", "Storyteller", "storyteller",  "✍️", "social", "commun", (_n, m) => m, 5),
  mk("share_friend", "Share Friend", "share_friend",  "🔗", "social", "commun", (n) => n.filter((x) => x.media_count > 0).length, 1),
  mk("mood_curator", "Mood Curator", "mood_curator",  "💖", "social", "rare", (_n, m) => m, 5),
  mk("travel_blogger", "Travel Blogger", "travel_blogger",  "📝", "social", "rare", (_n, m) => m, 30),
  mk("group_traveler", "Group Traveler", "group_traveler",  "👥", "social", "commun", (n) => n.filter((x) => x.status === "planned").length, 10),
  mk("influencer", "Influencer", "influencer",  "📱", "social", "épique", (_n, m) => m, 50),
  mk("social_legend", "Social Legend", "social_legend",  "🌟", "social", "légendaire", (_n, m) => m, 100),

  // 🏔️ ADVENTURE (8)
  mk("nature_lover", "Nature Lover", "nature_lover",  "🌿", "adventure", "commun", (n) => byType(n, "nature").length, 3),
  mk("mountain_adventurer", "Mountain Adventurer", "mountain_adventurer",  "⛰️", "adventure", "rare", (n) => byType(n, "nature").length, 5),
  mk("night_explorer", "Night Explorer", "night_explorer",  "🌙", "adventure", "rare", (n) => visitedByType(n, "nightlife").length, 3),
  mk("party_animal", "Party Animal", "party_animal",  "🪩", "adventure", "rare", (n) => byType(n, "nightlife").length, 5),
  mk("water_lover", "Water Lover", "water_lover",  "🌊", "adventure", "commun", (n) => n.filter((x) => /plage|beach|lac|lake|piscine|rivière|river/i.test(x.name)).length, 3),
  mk("sunset_chaser", "Sunset Chaser", "sunset_chaser",  "🌅", "adventure", "rare", (n) => n.filter((x) => /vue|view|panoram|rooftop|sunset|coucher/i.test(x.name)).length, 5),
  mk("extreme_sport", "Extreme Sport", "extreme_sport",  "🏄", "adventure", "épique", (n) => byType(n, "activity").length, 3),
  mk("legendary_explorer", "Legendary Explorer", "legendary_explorer",  "🛡️", "adventure", "légendaire", (n) => byType(n, "nature").length + byType(n, "activity").length + byType(n, "nightlife").length, 25),
];

export const BADGE_CATEGORIES: { key: BadgeCategory; label: string; icon: string; gradient: string }[] = [
  { key: "exploration", label: "Exploration", icon: "🧭", gradient: "from-cyan-500/30 to-blue-500/20" },
  { key: "food",        label: "Food",        icon: "🍽️", gradient: "from-orange-500/30 to-amber-400/20" },
  { key: "culture",     label: "Culture",     icon: "🏛️", gradient: "from-purple-500/30 to-fuchsia-400/20" },
  { key: "social",      label: "Social",      icon: "💬", gradient: "from-pink-500/30 to-rose-400/20" },
  { key: "adventure",   label: "Adventure",   icon: "🏔️", gradient: "from-emerald-500/30 to-teal-400/20" },
];

export const RARITY_STYLES: Record<BadgeRarity, { ring: string; glow: string; label: string }> = {
  commun:      { ring: "ring-slate-400/40",   glow: "shadow-[0_0_12px_hsl(220_15%_60%/0.4)]",   label: "text-slate-300" },
  rare:        { ring: "ring-cyan-400/60",    glow: "shadow-[0_0_18px_hsl(190_90%_60%/0.5)]",   label: "text-cyan-300" },
  "épique":    { ring: "ring-fuchsia-400/70", glow: "shadow-[0_0_22px_hsl(290_90%_65%/0.55)]",  label: "text-fuchsia-300" },
  "légendaire":{ ring: "ring-amber-400/80",   glow: "shadow-[0_0_28px_hsl(45_95%_60%/0.6)]",    label: "text-amber-300" },
};

export const TYPE_COLORS: Record<string, string> = {
  city: "hsl(280 90% 65%)",
  place: "hsl(190 90% 60%)",
  activity: "hsl(45 95% 60%)",
  food: "hsl(15 90% 60%)",
  culture: "hsl(280 80% 65%)",
  nature: "hsl(140 70% 55%)",
  nightlife: "hsl(260 90% 70%)",
  hotel: "hsl(210 70% 60%)",
  spot: "hsl(190 90% 60%)",
};

export const STATUS_COLORS: Record<string, string> = {
  planned: "hsl(220 15% 50%)",
  in_progress: "hsl(45 95% 60%)",
  visited: "hsl(140 70% 55%)",
};
