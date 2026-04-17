import { Zap, Sparkles, Crown, ArrowRight } from "lucide-react";

export type PlanMode = "quick" | "custom" | "tailored";

interface Props {
  onSelect: (mode: PlanMode) => void;
}

const MODES: {
  id: PlanMode;
  icon: React.ReactNode;
  title: string;
  duration: string;
  description: string;
  highlights: string[];
  badge?: string;
}[] = [
  {
    id: "quick",
    icon: <Zap className="w-5 h-5" />,
    title: "Plan rapide",
    duration: "≈ 1 min",
    description: "L'essentiel pour partir vite : destination, dates, budget, style et taille du groupe.",
    highlights: ["3 à 5 questions", "Itinéraire express", "Idéal pour tester"],
  },
  {
    id: "custom",
    icon: <Sparkles className="w-5 h-5" />,
    title: "Plan personnalisé",
    duration: "≈ 3 min",
    description: "On affine vos centres d'intérêt et le rythme souhaité pour un voyage qui vous ressemble.",
    highlights: ["8 à 10 questions", "Recommandations ciblées", "Bon équilibre"],
    badge: "Populaire",
  },
  {
    id: "tailored",
    icon: <Crown className="w-5 h-5" />,
    title: "Expérience sur-mesure",
    duration: "≈ 7 min",
    description: "Le questionnaire complet : préférences avancées, contraintes, immersion culturelle.",
    highlights: ["Toutes les questions", "Plan ultra-détaillé", "Pour les puristes"],
  },
];

const ModeSelector = ({ onSelect }: Props) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-foreground">Choisissez votre niveau de personnalisation</h3>
        <p className="text-sm text-muted-foreground">
          Vous pourrez toujours changer plus tard depuis le formulaire.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onSelect(mode.id)}
            className="group relative text-left glass-card rounded-2xl p-4 border border-border hover:border-primary/60 hover:shadow-lg transition-all flex flex-col gap-3"
          >
            {mode.badge && (
              <span className="absolute -top-2 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full gradient-button text-primary-foreground">
                {mode.badge}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-button flex items-center justify-center text-primary-foreground shrink-0">
                {mode.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground leading-tight">{mode.title}</p>
                <p className="text-xs text-muted-foreground">{mode.duration}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{mode.description}</p>
            <ul className="space-y-1 mt-auto">
              {mode.highlights.map((h) => (
                <li key={h} className="text-xs text-foreground/80 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  {h}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-end text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition">
              Choisir <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
