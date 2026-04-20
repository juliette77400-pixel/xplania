import type { ExploreNode } from "@/hooks/useExplore";

export interface BadgeDef {
  code: string;
  name: string;
  description: string;
  icon: string;
  check: (nodes: ExploreNode[], mediaCount: number) => boolean;
}

export const EXPLORE_BADGES: BadgeDef[] = [
  {
    code: "explorer",
    name: "Explorer",
    description: "Première ville visitée",
    icon: "🧭",
    check: (n) => n.some((x) => x.level === 1 && x.status === "visited"),
  },
  {
    code: "globe_trotter",
    name: "Globe Trotter",
    description: "5 lieux visités",
    icon: "🌍",
    check: (n) => n.filter((x) => x.status === "visited").length >= 5,
  },
  {
    code: "food_lover",
    name: "Food Lover",
    description: "5 spots gastronomiques",
    icon: "🍽️",
    check: (n) => n.filter((x) => x.type === "food").length >= 5,
  },
  {
    code: "culture_hunter",
    name: "Culture Hunter",
    description: "5 lieux culturels",
    icon: "🏛️",
    check: (n) => n.filter((x) => x.type === "culture").length >= 5,
  },
  {
    code: "memory_keeper",
    name: "Memory Keeper",
    description: "10 souvenirs ajoutés",
    icon: "📸",
    check: (_n, m) => m >= 10,
  },
  {
    code: "night_explorer",
    name: "Night Explorer",
    description: "3 expériences nocturnes",
    icon: "🌙",
    check: (n) => n.filter((x) => x.type === "nightlife" && x.status === "visited").length >= 3,
  },
];

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
