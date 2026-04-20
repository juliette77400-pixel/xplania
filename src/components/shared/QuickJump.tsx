import { Link, useLocation } from "react-router-dom";
import {
  Compass, Heart, Map, Activity, Briefcase, BookOpen, Wallet, FileText, Sparkles, Plane,
} from "lucide-react";
import { useActiveTrip } from "@/stores/useActiveTrip";

interface JumpItem {
  to: string;          // base route
  contextual?: (tripId: string) => string; // route when a trip is active
  label: string;
  emoji: string;
  icon: typeof Compass;
  color: string;
  desc: string;
  matchPrefix: string; // for "current page" detection
}

const ALL: JumpItem[] = [
  { to: "/discover",     matchPrefix: "/discover",     label: "Discover",   emoji: "🧭", icon: Compass,   color: "from-cyan-500/20 to-blue-500/20",     desc: "Lieux locaux IA" },
  { to: "/mood",         matchPrefix: "/mood",         label: "Mood",       emoji: "💫", icon: Heart,     color: "from-pink-500/20 to-purple-500/20",   desc: "Selon ton humeur" },
  { to: "/explore",      matchPrefix: "/explore",      contextual: (id) => `/explore/${id}`, label: "Travel Map", emoji: "🗺️", icon: Map,       color: "from-violet-500/20 to-indigo-500/20", desc: "Carte & badges" },
  { to: "/suivi",        matchPrefix: "/suivi",        contextual: (id) => `/suivi/${id}`,   label: "Suivi de voyage",   emoji: "📍", icon: Activity,  color: "from-emerald-500/20 to-teal-500/20",  desc: "Suivi GPS live" },
  { to: "/carnets",      matchPrefix: "/carnet",       contextual: (id) => `/carnet/${id}`,  label: "Carnet",     emoji: "📔", icon: BookOpen,  color: "from-amber-500/20 to-orange-500/20",  desc: "Journal voyage" },
  { to: "/guide-valise", matchPrefix: "/guide-valise", label: "Valise",     emoji: "🧳", icon: Briefcase, color: "from-rose-500/20 to-red-500/20",      desc: "Checklist intelligente" },
  { to: "/guide-budget", matchPrefix: "/guide-budget", label: "Budget",     emoji: "💰", icon: Wallet,    color: "from-yellow-500/20 to-amber-500/20",  desc: "Dépenses & alertes" },
  { to: "/guide-visa",   matchPrefix: "/guide-visa",   label: "Visa",       emoji: "📋", icon: FileText,  color: "from-sky-500/20 to-cyan-500/20",      desc: "Formalités pays" },
];

interface Props {
  title?: string;
  compact?: boolean;
  max?: number;
}

const QuickJump = ({ title = "Continuer ton voyage", compact = false, max }: Props) => {
  const { pathname } = useLocation();
  const { tripId, destination } = useActiveTrip();

  const items = ALL.filter((it) => !pathname.startsWith(it.matchPrefix)).slice(0, max ?? ALL.length);
  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {tripId && destination ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full ml-1">
            <Plane className="w-3 h-3" /> Voyage actif : <strong>{destination}</strong>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">— accès direct sans retour à l'accueil</span>
        )}
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {items.map((it) => {
          const Icon = it.icon;
          const href = tripId && it.contextual ? it.contextual(tripId) : it.to;
          return (
            <Link
              key={it.to}
              to={href}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${it.color} backdrop-blur-sm p-4 transition-all hover:scale-[1.03] hover:border-primary/40 hover:shadow-lg`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{it.emoji}</span>
                <Icon className="w-4 h-4 text-foreground/70 ml-auto group-hover:text-primary transition-colors" />
              </div>
              <div className="text-sm font-bold text-foreground">{it.label}</div>
              {!compact && (
                <div className="text-[11px] text-muted-foreground mt-0.5">{it.desc}</div>
              )}
              {tripId && it.contextual && (
                <div className="text-[10px] text-primary mt-1 font-medium">→ ouvrir mon voyage</div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default QuickJump;
