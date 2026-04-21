import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Trophy, Search, Landmark, Heart, MapPin, Utensils, Mountain,
  Compass, Moon, Camera, Star, Award, Lock, CheckCircle,
  ArrowRight, Clock, Sparkles, BarChart3, Zap,
} from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useActiveTrip } from "@/stores/useActiveTrip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { adaptToTripDuration, celebrateUnlock } from "@/lib/badges-fx";
import { computeXp } from "@/lib/xp-levels";
import XpHeader from "@/components/gamification/XpHeader";
import { differenceInDays, parseISO } from "date-fns";

// Session-scoped guard so confetti never re-fires across remounts/refreshes
const SEEN_BADGES_KEY = "xplania_seen_badges_v1";
const loadSeen = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(SEEN_BADGES_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
};
const saveSeen = (s: Set<string>) => {
  try { sessionStorage.setItem(SEEN_BADGES_KEY, JSON.stringify([...s])); } catch { /* noop */ }
};

// ── Badge Collection ──

type BadgeRarity = "Commun" | "Rare" | "Épique" | "Légendaire";

interface BadgeMeta {
  code: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  emoji: string;
  rarity: BadgeRarity;
  bgColor: string;
  /** how to compute current count from live data */
  metric: keyof BadgeCounts;
  baseTarget: number;
  unit: string;
}

interface BadgeCounts {
  exploreVisited: number;
  exploreTotal: number;
  journalNotes: number;
  journalPhotos: number;
  journalLocations: number;
  journalMoods: number;
  journalHighlights: number;
  moodFavorites: number;
  moodHiddenGems: number;
  exploreBadgesOwned: number;
  journalBadgesOwned: number;
  moodBadgesOwned: number;
}

const RARITY_COLORS: Record<BadgeRarity, string> = {
  Commun: "border-muted-foreground/30 text-muted-foreground",
  Rare: "border-blue-500/40 text-blue-400",
  Épique: "border-purple-500/40 text-purple-400",
  Légendaire: "border-amber-500/40 text-amber-400",
};

const RARITY_GLOW: Record<BadgeRarity, string> = {
  Commun: "",
  Rare: "shadow-[0_0_20px_hsl(210_80%_55%/0.15)]",
  Épique: "shadow-[0_0_25px_hsl(270_70%_55%/0.2)]",
  Légendaire: "shadow-[0_0_30px_hsl(40_95%_55%/0.25)]",
};

const BADGE_DEFS: BadgeMeta[] = [
  { code: "urban", name: "Urban Explorer", emoji: "🗺️", description: "Explore 5 lieux", icon: <MapPin className="w-7 h-7" />, rarity: "Commun", bgColor: "from-slate-500 to-slate-600", metric: "exploreVisited", baseTarget: 5, unit: "lieux" },
  { code: "culture", name: "Culture Hunter", emoji: "🏛️", description: "Visite 10 lieux culturels", icon: <Landmark className="w-7 h-7" />, rarity: "Rare", bgColor: "from-blue-500 to-blue-600", metric: "journalLocations", baseTarget: 10, unit: "lieux culturels" },
  { code: "local", name: "Local Insider", emoji: "💎", description: "Découvre 5 pépites locales", icon: <Star className="w-7 h-7" />, rarity: "Épique", bgColor: "from-purple-500 to-purple-600", metric: "moodHiddenGems", baseTarget: 5, unit: "hidden gems" },
  { code: "mountain", name: "Mountain Adventurer", emoji: "⛰️", description: "Visite 3 sites nature", icon: <Mountain className="w-7 h-7" />, rarity: "Rare", bgColor: "from-emerald-500 to-emerald-600", metric: "exploreVisited", baseTarget: 3, unit: "sites" },
  { code: "hidden", name: "Hidden Gems Finder", emoji: "🧭", description: "Sauvegarde 10 favoris mood", icon: <Compass className="w-7 h-7" />, rarity: "Épique", bgColor: "from-purple-400 to-violet-500", metric: "moodFavorites", baseTarget: 10, unit: "favoris" },
  { code: "food", name: "Food Lover", emoji: "🍽️", description: "Note 5 spécialités locales", icon: <Utensils className="w-7 h-7" />, rarity: "Commun", bgColor: "from-orange-500 to-orange-600", metric: "journalNotes", baseTarget: 5, unit: "notes" },
  { code: "night", name: "Night Explorer", emoji: "🌙", description: "Partage 5 humeurs", icon: <Moon className="w-7 h-7" />, rarity: "Rare", bgColor: "from-indigo-500 to-indigo-600", metric: "journalMoods", baseTarget: 5, unit: "humeurs" },
  { code: "memory", name: "Memory Keeper", emoji: "📷", description: "Ajoute 10 photos", icon: <Camera className="w-7 h-7" />, rarity: "Épique", bgColor: "from-pink-500 to-rose-500", metric: "journalPhotos", baseTarget: 10, unit: "photos" },
  { code: "voyageur", name: "Voyageur Master", emoji: "🏆", description: "Débloque 10 badges au total", icon: <Award className="w-7 h-7" />, rarity: "Légendaire", bgColor: "from-amber-400 to-orange-500", metric: "exploreBadgesOwned", baseTarget: 10, unit: "badges" },
];

// ── Daily Missions (live) ──
interface Mission {
  title: string;
  xp: number;
  icon: React.ReactNode;
  iconBg: string;
  metric: keyof BadgeCounts;
  total: number;
  link: string;
}

const MISSION_DEFS: Mission[] = [
  { title: "Sauvegarder 1 hidden gem", xp: 50, icon: <Search className="w-5 h-5 text-white" />, iconBg: "from-cyan-400 to-cyan-500", metric: "moodHiddenGems", total: 1, link: "/discover" },
  { title: "Explorer 1 lieu culturel", xp: 75, icon: <Landmark className="w-5 h-5 text-white" />, iconBg: "from-purple-400 to-purple-500", metric: "exploreVisited", total: 1, link: "/explore" },
  { title: "Partager 1 émotion dans ton carnet", xp: 100, icon: <Heart className="w-5 h-5 text-white" />, iconBg: "from-pink-400 to-rose-500", metric: "journalMoods", total: 1, link: "/carnets" },
];

// ── Weekly XP (kept as visualization, derived from real counts × XP/badge) ──

const GamificationPage = () => {
  const { user } = useAuth();
  const { tripId, departureDate, returnDate } = useActiveTrip();

  // Adapt targets to trip duration
  const tripDays = useMemo(() => {
    if (departureDate && returnDate) {
      try {
        const d = differenceInDays(parseISO(returnDate), parseISO(departureDate)) + 1;
        return d > 0 ? d : null;
      } catch { return null; }
    }
    return null;
  }, [departureDate, returnDate]);

  const [counts, setCounts] = useState<BadgeCounts>({
    exploreVisited: 0, exploreTotal: 0,
    journalNotes: 0, journalPhotos: 0, journalLocations: 0, journalMoods: 0, journalHighlights: 0,
    moodFavorites: 0, moodHiddenGems: 0,
    exploreBadgesOwned: 0, journalBadgesOwned: 0, moodBadgesOwned: 0,
  });

  // Fetch live progress (scoped to active trip when available)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const run = async () => {
      let nodesQ = supabase.from("explore_nodes").select("status,type,trip_id").eq("user_id", user.id);
      if (tripId) nodesQ = nodesQ.eq("trip_id", tripId);

      let blocksQ = supabase
        .from("journal_blocks")
        .select("type,journal_id,journals!inner(trip_id)")
        .eq("user_id", user.id);
      if (tripId) blocksQ = blocksQ.eq("journals.trip_id", tripId);

      const [nodesRes, blocksRes, favRes, eb, jb, mb] = await Promise.all([
        nodesQ,
        blocksQ,
        supabase.from("mood_favorites").select("place_id,mood_places!inner(hidden_gem)").eq("user_id", user.id),
        supabase.from("explore_badges").select("code", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("journal_badges").select("code", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("mood_badges").select("code", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (cancelled) return;

      const nodes: any[] = nodesRes.data || [];
      const blocks: any[] = blocksRes.data || [];
      const favs: any[] = favRes.data || [];
      const blockCount = (t: string) => blocks.filter((b) => b.type === t).length;

      setCounts({
        exploreVisited: nodes.filter((n) => n.status === "visited").length,
        exploreTotal: nodes.length,
        journalNotes: blockCount("note"),
        journalPhotos: blockCount("photo"),
        journalLocations: blockCount("location"),
        journalMoods: blockCount("mood"),
        journalHighlights: blockCount("highlight"),
        moodFavorites: favs.length,
        moodHiddenGems: favs.filter((f) => f.mood_places?.hidden_gem).length,
        exploreBadgesOwned: eb.count || 0,
        journalBadgesOwned: jb.count || 0,
        moodBadgesOwned: mb.count || 0,
      });
    };
    run();
    return () => { cancelled = true; };
  }, [user, tripId]);

  // Derived computed badges with real progress + adapted targets
  const badges = useMemo(
    () =>
      BADGE_DEFS.map((b) => {
        const target = adaptToTripDuration(b.baseTarget, tripDays);
        const current = counts[b.metric];
        const progress = Math.min(100, Math.round((current / target) * 100));
        return { ...b, target, current, progress, unlocked: current >= target };
      }),
    [counts, tripDays]
  );

  // Detect newly-unlocked badges → confetti.
  // Persist seen-badges in sessionStorage so re-mounts / data refetches do NOT re-trigger
  // animations for badges already unlocked in this session.
  const seenBadges = useRef<Set<string>>(loadSeen());
  const hydratedRef = useRef(false);
  useEffect(() => {
    const nowUnlocked = badges.filter((b) => b.unlocked).map((b) => b.code);
    // First data load: silently mark all current as seen (no confetti)
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      const merged = new Set([...seenBadges.current, ...nowUnlocked]);
      seenBadges.current = merged;
      saveSeen(merged);
      return;
    }
    let changed = false;
    for (const code of nowUnlocked) {
      if (!seenBadges.current.has(code)) {
        const def = badges.find((b) => b.code === code);
        if (def) celebrateUnlock({ name: def.name, icon: def.emoji, description: def.description });
        seenBadges.current.add(code);
        changed = true;
      }
    }
    if (changed) saveSeen(seenBadges.current);
  }, [badges]);

  const missions = useMemo(
    () => MISSION_DEFS.map((m) => ({ ...m, progress: Math.min(m.total, counts[m.metric]) })),
    [counts]
  );

  // Real weekly XP estimate: 50 XP per badge across modules
  const totalBadges = counts.exploreBadgesOwned + counts.journalBadgesOwned + counts.moodBadgesOwned;
  const totalXp = totalBadges * 50 + counts.exploreVisited * 20 + counts.journalNotes * 10;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <main className="container mx-auto px-4 sm:px-6 max-w-6xl py-10 space-y-16">

        {/* ══════ HERO STATS ══════ */}
        <section className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Collection de Badges</h1>
          <p className="text-muted-foreground">
            Explore, collectionne et débloque des badges uniques
            {tripDays != null && (
              <span className="block text-xs mt-1 text-primary">
                ✨ Objectifs adaptés à ton voyage de {tripDays} {tripDays === 1 ? "jour" : "jours"}
              </span>
            )}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-3xl mx-auto">
            {[
              { label: "Badges débloqués", value: badges.filter((b) => b.unlocked).length, suffix: `/${badges.length}` },
              { label: "Lieux visités", value: counts.exploreVisited },
              { label: "Souvenirs", value: counts.journalNotes + counts.journalPhotos },
              { label: "XP estimés", value: totalXp.toLocaleString() },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card border border-border p-4">
                <p className="text-2xl font-bold gradient-text">
                  {s.value}{s.suffix || ""}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════ BADGE COLLECTION (live progress) ══════ */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((b, i) => (
              <motion.div
                key={b.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                className={cn(
                  "relative rounded-2xl border p-5 transition-all",
                  b.unlocked
                    ? `border-primary/30 bg-card ${RARITY_GLOW[b.rarity]}`
                    : "border-border bg-card/40"
                )}
              >
                {/* Unlock pulse ring for already-unlocked badges */}
                {b.unlocked && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    initial={{ boxShadow: "0 0 0 0 hsl(var(--primary) / 0.5)" }}
                    animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0.5)", "0 0 0 14px hsl(var(--primary) / 0)"] }}
                    transition={{ repeat: Infinity, duration: 2.6 }}
                  />
                )}

                <div className="flex items-start justify-between mb-3 relative">
                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white",
                      b.bgColor,
                      !b.unlocked && "opacity-50 grayscale"
                    )}
                  >
                    {b.icon}
                  </motion.div>
                  {b.unlocked ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </motion.div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <h3 className={cn("font-bold text-lg mb-1", b.unlocked ? "text-foreground" : "text-muted-foreground")}>
                  {b.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{b.description}</p>

                <span className={cn("text-[10px] font-semibold uppercase tracking-wider border rounded-full px-2.5 py-0.5 inline-block mb-3", RARITY_COLORS[b.rarity])}>
                  {b.rarity}
                </span>

                {/* Live progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={b.unlocked ? "text-emerald-400" : "text-primary"}>
                      {b.unlocked ? "Débloqué" : "Progression"}
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {b.current}/{b.target} {b.unit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${b.progress}%` }}
                      transition={{ duration: 1, delay: i * 0.05 }}
                      className={cn(
                        "h-full rounded-full",
                        b.unlocked
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : b.rarity === "Commun" && "bg-muted-foreground",
                        !b.unlocked && b.rarity === "Rare" && "bg-blue-500",
                        !b.unlocked && b.rarity === "Épique" && "bg-purple-500",
                        !b.unlocked && b.rarity === "Légendaire" && "bg-gradient-to-r from-amber-400 to-orange-500",
                      )}
                    />
                  </div>
                  {!b.unlocked && (
                    <p className="text-[10px] text-muted-foreground/80 mt-1">
                      Plus que <span className="font-semibold text-foreground">{Math.max(0, b.target - b.current)}</span> pour débloquer ✨
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════ DAILY MISSIONS (live) ══════ */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Missions du Jour</h2>
          <p className="text-muted-foreground mb-8">Accomplis tes missions quotidiennes et gagne de l'XP</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {missions.map((m, i) => {
              const done = m.progress >= m.total;
              return (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "rounded-2xl border bg-card p-5 text-left space-y-4 transition-colors",
                    done ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", m.iconBg)}>
                      {m.icon}
                    </div>
                    <span className="text-xs font-bold border border-amber-500/40 text-amber-400 rounded-full px-2.5 py-1">
                      +{m.xp} XP
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground">{m.title}</h3>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={done ? "text-emerald-400" : "text-primary"}>
                        {done ? "Terminé ✓" : "Progression"}
                      </span>
                      <span className="text-foreground font-bold tabular-nums">{m.progress}/{m.total}</span>
                    </div>
                    <Progress
                      value={(m.progress / m.total) * 100}
                      className={cn("h-1.5", done && "[&>div]:bg-emerald-400")}
                    />
                  </div>

                  <Link
                    to={m.link}
                    className={cn(
                      "block w-full text-center rounded-xl font-semibold py-2.5 text-sm transition-opacity",
                      done
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:opacity-90"
                    )}
                  >
                    {done ? "Mission accomplie ✓" : "Commencer →"}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ══════ PROGRESSION RHYTHM ══════ */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Ton Rythme de Progression</h2>
          <p className="text-muted-foreground mb-8">Aperçu de ton activité Xplania</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 text-left">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Activité par module</h3>
                  <p className="text-xs text-muted-foreground">Tes contributions actuelles</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Carnet — notes", value: counts.journalNotes, max: 20 },
                  { label: "Carnet — photos", value: counts.journalPhotos, max: 20 },
                  { label: "Explore — lieux visités", value: counts.exploreVisited, max: 20 },
                  { label: "Mood — favoris", value: counts.moodFavorites, max: 15 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-bold text-foreground tabular-nums">{row.value}</span>
                    </div>
                    <Progress value={Math.min(100, (row.value / row.max) * 100)} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-purple-500/10 to-violet-500/5 p-5 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-foreground">Voyage actif</h3>
                </div>
                {tripId ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-1">Durée</p>
                    <p className="text-3xl font-bold text-foreground mb-3">{tripDays || "—"} j</p>
                    <p className="text-xs text-muted-foreground">
                      Tes objectifs sont automatiquement adaptés à la durée de ton voyage.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun voyage actif — crée ou sélectionne un voyage pour adapter tes objectifs.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-foreground">Bilan badges</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Explore</span><span className="font-bold">{counts.exploreBadgesOwned}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Carnet</span><span className="font-bold">{counts.journalBadgesOwned}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Mood</span><span className="font-bold">{counts.moodBadgesOwned}</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ FINAL CTA ══════ */}
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600/30 via-violet-500/20 to-blue-600/30 border border-purple-500/20 py-16 text-center">
          <div className="flex justify-center gap-4 mb-6">
            {[
              { bg: "from-amber-400 to-orange-500", icon: <Trophy className="w-6 h-6 text-white" /> },
              { bg: "from-purple-400 to-violet-500", icon: <Star className="w-6 h-6 text-white" /> },
              { bg: "from-cyan-400 to-blue-500", icon: <Award className="w-6 h-6 text-white" /> },
            ].map((b, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, delay: i * 0.5 }}
                className={cn("w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", b.bg)}
              >
                {b.icon}
              </motion.div>
            ))}
          </div>

          <p className="text-muted-foreground mb-2">Continue ton aventure et débloque des badges épiques.</p>
          <p className="text-sm text-muted-foreground/70 max-w-lg mx-auto mb-8">
            Chaque action compte : une note, une photo, une visite, un favori… tout te rapproche du prochain palier.
          </p>

          <Link
            to="/explore"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold px-8 py-3.5 text-sm hover:opacity-90 transition-opacity shadow-lg"
          >
            Poursuivre ma progression <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
      <QuickJump />
    </div>
  );
};

export default GamificationPage;
