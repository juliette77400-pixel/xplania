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

// ── Badge Collection ──

type BadgeRarity = "Commun" | "Rare" | "Épique" | "Légendaire";

interface BadgeDef {
  code: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  rarity: BadgeRarity;
  bgColor: string;
  progress: number; // 0-100
  unlocked: boolean;
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

const BADGES: BadgeDef[] = [
  { code: "urban", name: "Urban Explorer", description: "Explore 5 villes", icon: <MapPin className="w-7 h-7" />, rarity: "Commun", bgColor: "from-slate-500 to-slate-600", progress: 100, unlocked: true },
  { code: "culture", name: "Culture Hunter", description: "Visite 10 lieux culturels", icon: <Landmark className="w-7 h-7" />, rarity: "Rare", bgColor: "from-blue-500 to-blue-600", progress: 80, unlocked: false },
  { code: "local", name: "Local Insider", description: "Découvre 15 pépites locales", icon: <Star className="w-7 h-7" />, rarity: "Épique", bgColor: "from-purple-500 to-purple-600", progress: 100, unlocked: true },
  { code: "mountain", name: "Mountain Adventurer", description: "3 randonnées complétées", icon: <Mountain className="w-7 h-7" />, rarity: "Rare", bgColor: "from-emerald-500 to-emerald-600", progress: 60, unlocked: false },
  { code: "hidden", name: "Hidden Gems Finder", description: "Trouve 20 pépites cachées", icon: <Compass className="w-7 h-7" />, rarity: "Épique", bgColor: "from-purple-400 to-violet-500", progress: 45, unlocked: false },
  { code: "food", name: "Food Lover", description: "Goûte 10 spécialités locales", icon: <Utensils className="w-7 h-7" />, rarity: "Commun", bgColor: "from-orange-500 to-orange-600", progress: 100, unlocked: true },
  { code: "night", name: "Night Explorer", description: "5 sorties nocturnes", icon: <Moon className="w-7 h-7" />, rarity: "Rare", bgColor: "from-indigo-500 to-indigo-600", progress: 40, unlocked: false },
  { code: "memory", name: "Memory Keeper", description: "Ajoute 50 souvenirs", icon: <Camera className="w-7 h-7" />, rarity: "Épique", bgColor: "from-pink-500 to-rose-500", progress: 30, unlocked: false },
  { code: "voyageur", name: "Voyageur Master", description: "Complète toutes les missions", icon: <Award className="w-7 h-7" />, rarity: "Légendaire", bgColor: "from-amber-400 to-orange-500", progress: 25, unlocked: false },
];

// ── Daily Missions ──

interface Mission {
  title: string;
  xp: number;
  icon: React.ReactNode;
  iconBg: string;
  progress: number;
  total: number;
  link: string;
}

const MISSIONS: Mission[] = [
  { title: "Découvrir 1 pépite locale", xp: 50, icon: <Search className="w-5 h-5 text-white" />, iconBg: "from-cyan-400 to-cyan-500", progress: 0, total: 1, link: "/discover" },
  { title: "Explorer un lieu culturel", xp: 75, icon: <Landmark className="w-5 h-5 text-white" />, iconBg: "from-purple-400 to-purple-500", progress: 0, total: 1, link: "/explore" },
  { title: "Partager une émotion dans ton carnet", xp: 100, icon: <Heart className="w-5 h-5 text-white" />, iconBg: "from-pink-400 to-rose-500", progress: 0, total: 1, link: "/carnets" },
];

// ── Weekly XP Data ──

const WEEKLY_XP = [
  { day: "Lun", xp: 120 },
  { day: "Mar", xp: 280 },
  { day: "Mer", xp: 350 },
  { day: "Jeu", xp: 420 },
  { day: "Ven", xp: 200 },
  { day: "Sam", xp: 380 },
  { day: "Dim", xp: 150 },
];

// ── Upcoming Rewards ──

interface Reward {
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  condition: string;
  progress: number;
  eta: string;
}

const REWARDS: Reward[] = [
  { name: "Badge Voyageur Premium", description: "Accès à des expériences exclusives et recommandations VIP", icon: <Trophy className="w-6 h-6 text-white" />, iconBg: "from-amber-400 to-orange-500", condition: "15 pays visités", progress: 75, eta: "Bientôt disponible" },
  { name: "Mode Nuit Holographique", description: "Interface futuriste avec effets lumineux et animations avancées", icon: <Moon className="w-6 h-6 text-white" />, iconBg: "from-purple-400 to-violet-500", condition: "5000 XP totaux", progress: 45, eta: "Environ 6 semaines" },
  { name: "Niveau Explorateur Mythique", description: "Statut légendaire avec badges animés et récompenses permanentes", icon: <Zap className="w-6 h-6 text-white" />, iconBg: "from-cyan-400 to-blue-500", condition: "Niveau 15 atteint", progress: 30, eta: "Environ 7 semaines" },
];

const GamificationPage = () => {
  const totalWeekXP = WEEKLY_XP.reduce((s, d) => s + d.xp, 0);
  const avgXP = Math.round(totalWeekXP / 7);
  const maxXP = Math.max(...WEEKLY_XP.map((d) => d.xp));

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <main className="container mx-auto px-4 sm:px-6 max-w-6xl py-10 space-y-16">

        {/* ══════ BADGE COLLECTION ══════ */}
        <section className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Collection de Badges</h1>
          <p className="text-muted-foreground">Explore, collectionne et débloque des badges uniques</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {BADGES.map((b, i) => (
              <motion.div
                key={b.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative rounded-2xl border p-5 transition-all",
                  b.unlocked
                    ? `border-primary/30 bg-card ${RARITY_GLOW[b.rarity]}`
                    : "border-border bg-card/40"
                )}
              >
                {/* Icon */}
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white",
                    b.bgColor,
                    !b.unlocked && "opacity-50 grayscale"
                  )}>
                    {b.icon}
                  </div>
                  {b.unlocked ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className={cn("font-bold text-lg mb-1", b.unlocked ? "text-foreground" : "text-muted-foreground")}>
                  {b.name}
                </h3>

                {/* Rarity */}
                <span className={cn("text-[10px] font-semibold uppercase tracking-wider border rounded-full px-2.5 py-0.5 inline-block mb-3", RARITY_COLORS[b.rarity])}>
                  {b.rarity}
                </span>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-primary">Progression</span>
                    <span className="font-bold text-foreground">{b.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${b.progress}%` }}
                      transition={{ duration: 1, delay: i * 0.05 }}
                      className={cn(
                        "h-full rounded-full",
                        b.rarity === "Commun" && "bg-muted-foreground",
                        b.rarity === "Rare" && "bg-blue-500",
                        b.rarity === "Épique" && "bg-purple-500",
                        b.rarity === "Légendaire" && "bg-gradient-to-r from-amber-400 to-orange-500",
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════ DAILY MISSIONS ══════ */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Missions du Jour</h2>
          <p className="text-muted-foreground mb-8">Accomplis tes missions quotidiennes et gagne de l'XP</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MISSIONS.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-5 text-left space-y-4"
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
                    <span className="text-primary">Progression</span>
                    <span className="text-foreground font-bold">{m.progress}/{m.total}</span>
                  </div>
                  <Progress value={(m.progress / m.total) * 100} className="h-1.5" />
                </div>

                <Link
                  to={m.link}
                  className="block w-full text-center rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity"
                >
                  Commencer →
                </Link>
              </motion.div>
            ))}
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-2 mt-6 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/40 transition"
          >
            Voir toutes mes missions <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* ══════ PROGRESSION RHYTHM ══════ */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Ton Rythme de Progression</h2>
          <p className="text-muted-foreground mb-8">Analyse de ton activité et de tes accomplissements</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weekly chart */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 text-left">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Progression hebdomadaire</h3>
                  <p className="text-xs text-muted-foreground">XP gagnés par jour</p>
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-3 h-40 mb-4">
                {WEEKLY_XP.map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.xp / maxXP) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      className="w-full rounded-lg bg-gradient-to-t from-primary/60 to-primary"
                    />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Total cette semaine</p>
                  <p className="text-xl font-bold text-foreground">{totalWeekXP.toLocaleString()} XP</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Moyenne par jour</p>
                  <p className="text-xl font-bold text-primary">{avgXP} XP</p>
                </div>
              </div>
            </div>

            {/* Side cards */}
            <div className="space-y-4">
              {/* Exploration time */}
              <div className="rounded-2xl border border-border bg-gradient-to-br from-purple-500/10 to-violet-500/5 p-5 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-foreground">Temps d'exploration</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Temps cumulé</p>
                <p className="text-3xl font-bold text-foreground mb-3">24.5h</p>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Cette semaine</span>
                  <span className="font-bold text-foreground">6.2h</span>
                </div>
                <Progress value={62} className="h-1.5" />
              </div>

              {/* Highlights */}
              <div className="rounded-2xl border border-border bg-card p-5 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-foreground">Moments forts</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { text: "Premier Badge Épique", date: "15 Nov 2024", color: "border-l-purple-500" },
                    { text: "Niveau 5 Atteint", date: "22 Nov 2024", color: "border-l-primary" },
                    { text: "Mission Parfaite", date: "28 Nov 2024", color: "border-l-pink-500" },
                  ].map((h) => (
                    <div key={h.text} className={cn("border-l-2 pl-3", h.color)}>
                      <p className="text-sm font-semibold text-foreground">{h.text}</p>
                      <p className="text-[10px] text-muted-foreground">{h.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ AI RECOMMENDATION ══════ */}
        <section>
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-violet-500/5 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                <Sparkles className="w-3.5 h-3.5" /> Recommandation IA
              </span>
              <h2 className="text-xl font-bold text-foreground">Ta prochaine destination idéale</h2>
              <p className="text-muted-foreground">
                Selon ta progression, la prochaine destination idéale pour toi est <strong className="text-foreground">Lisbonne</strong>.
                Tu débloqueras 2 badges si tu explores ce lieu.
              </p>
              <div className="space-y-3">
                <div className="rounded-xl bg-card/60 border border-border p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">2 badges à débloquer</p>
                    <p className="text-xs text-muted-foreground">Ocean Spirit & Culture Hunter</p>
                  </div>
                </div>
                <div className="rounded-xl bg-card/60 border border-border p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">+450 XP potentiels</p>
                    <p className="text-xs text-muted-foreground">Basé sur tes préférences</p>
                  </div>
                </div>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold px-6 py-3 text-sm hover:opacity-90 transition-opacity"
              >
                Explorer maintenant <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Destination card */}
            <div className="rounded-2xl overflow-hidden border border-border bg-card">
              <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-5xl">🇵🇹</span>
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold">Lisbonne, Portugal</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-foreground mb-1">Lisbonne</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ville côtière riche en culture et en authenticité. Parfaite pour ton profil d'explorateur.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-lg font-bold text-primary">12</p><p className="text-[10px] text-muted-foreground">Pépites</p></div>
                  <div><p className="text-lg font-bold text-primary">8</p><p className="text-[10px] text-muted-foreground">Lieux</p></div>
                  <div><p className="text-lg font-bold text-emerald-400">95%</p><p className="text-[10px] text-muted-foreground">Match</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ UPCOMING REWARDS ══════ */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Récompenses à Venir</h2>
          <p className="text-muted-foreground mb-8">Continue ta progression pour débloquer ces récompenses exclusives</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {REWARDS.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-5 text-left space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", r.iconBg)}>
                    {r.icon}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {[0, 1, 2].map((d) => (
                      <div key={d} className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{r.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                </div>
                <div className="rounded-lg bg-muted/20 px-3 py-2">
                  <p className="text-xs text-foreground">● {r.condition}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-primary">Déblocage</span>
                    <span className="font-bold text-foreground">{r.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.progress}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn("h-full rounded-full bg-gradient-to-r", r.iconBg)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">{r.eta}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════ FINAL CTA ══════ */}
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600/30 via-violet-500/20 to-blue-600/30 border border-purple-500/20 py-16 text-center">
          {/* Floating badges */}
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
            Chaque exploration te rapproche de nouveaux niveaux, de récompenses exclusives et d'expériences inoubliables.
          </p>

          <Link
            to="/explore"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold px-8 py-3.5 text-sm hover:opacity-90 transition-opacity shadow-lg"
          >
            Poursuivre ma progression <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="border-t border-border/30 mt-12 pt-8 flex justify-center gap-12">
            {[
              { value: "10+", label: "Badges disponibles" },
              { value: "5,000", label: "XP à gagner" },
              { value: "∞", label: "Possibilités" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <QuickJump />
    </div>
  );
};

export default GamificationPage;
