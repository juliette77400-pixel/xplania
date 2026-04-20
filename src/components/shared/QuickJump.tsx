import { Link, useLocation } from "react-router-dom";
import {
  Compass, Heart, Map, Activity, Briefcase, BookOpen, Wallet, FileText, Sparkles,
} from "lucide-react";

interface JumpItem {
  to: string;
  label: string;
  emoji: string;
  icon: typeof Compass;
  color: string; // tailwind gradient classes
  desc: string;
}

const ALL: JumpItem[] = [
  { to: "/discover",     label: "Discover",   emoji: "🧭", icon: Compass,   color: "from-cyan-500/20 to-blue-500/20",        desc: "Lieux locaux IA" },
  { to: "/mood",         label: "Mood",       emoji: "💫", icon: Heart,     color: "from-pink-500/20 to-purple-500/20",      desc: "Selon ton humeur" },
  { to: "/explore",      label: "Travel Map", emoji: "🗺️", icon: Map,       color: "from-violet-500/20 to-indigo-500/20",    desc: "Carte & badges" },
  { to: "/suivi",        label: "Tracking",   emoji: "📍", icon: Activity,  color: "from-emerald-500/20 to-teal-500/20",     desc: "Suivi GPS live" },
  { to: "/carnets",      label: "Carnet",     emoji: "📔", icon: BookOpen,  color: "from-amber-500/20 to-orange-500/20",     desc: "Journal voyage" },
  { to: "/guide-valise", label: "Valise",     emoji: "🧳", icon: Briefcase, color: "from-rose-500/20 to-red-500/20",         desc: "Checklist intelligente" },
  { to: "/guide-budget", label: "Budget",     emoji: "💰", icon: Wallet,    color: "from-yellow-500/20 to-amber-500/20",     desc: "Dépenses & alertes" },
  { to: "/guide-visa",   label: "Visa",       emoji: "📋", icon: FileText,  color: "from-sky-500/20 to-cyan-500/20",         desc: "Formalités pays" },
];

interface Props {
  /** Optional title above the grid. */
  title?: string;
  /** Compact variant — smaller cards. */
  compact?: boolean;
  /** Limit max items shown (default: all except current). */
  max?: number;
}

/**
 * QuickJump: contextual cross-module navigation that lets users jump from any
 * feature to any other without going back to the homepage.
 */
const QuickJump = ({ title = "Continuer ton voyage", compact = false, max }: Props) => {
  const { pathname } = useLocation();

  const items = ALL.filter((it) => !pathname.startsWith(it.to)).slice(0, max ?? ALL.length);

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">— accès direct sans retour à l'accueil</span>
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
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
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default QuickJump;
