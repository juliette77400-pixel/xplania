import { motion } from "framer-motion";
import { CloudSun, MapPin, Sparkles } from "lucide-react";

interface ValiseHeroProps {
  destination: string;
  days: number;
  onGenerate: () => void;
  isGenerating: boolean;
}

const ValiseHero = ({ destination, days, onGenerate, isGenerating }: ValiseHeroProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card rounded-2xl overflow-hidden"
  >
    <div className="flex flex-col md:flex-row">
      {/* Left text */}
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold w-fit mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          IA Avancée Xplania
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          <span className="gradient-text">L'IA qui prépare</span>
          <br />
          ta valise de voyage
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md">
          Prépare ta valise en quelques secondes grâce à l'IA. Xplania analyse la météo,
          la culture locale et ton style de voyage pour générer une valise parfaitement adaptée.
        </p>

        {!isGenerating && (
          <button
            onClick={onGenerate}
            className="gradient-button inline-flex items-center gap-3 px-8 py-4 rounded-xl text-primary-foreground font-bold text-base hover:opacity-90 transition-opacity w-fit shadow-lg"
          >
            🧳 Générer ma valise <Sparkles className="w-4 h-4" />
          </button>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-5">
          {[
            { icon: <CloudSun className="w-3.5 h-3.5" />, label: "Météo analysée" },
            { icon: <MapPin className="w-3.5 h-3.5" />, label: "Conseils culturels" },
            { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Valise optimisée" },
          ].map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs font-medium"
            >
              {badge.icon} {badge.label}
            </span>
          ))}
        </div>
      </div>

      {/* Right image */}
      <div className="w-full md:w-2/5 relative min-h-[220px] md:min-h-[320px]">
        <img
          src="https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=600&q=80"
          alt="Valise de voyage"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/80 md:bg-gradient-to-r md:from-background/60 md:to-transparent" />
        {/* Floating info */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur text-xs font-semibold text-foreground">
            📍 {destination}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur text-xs font-semibold text-foreground">
            📅 {days} jours
          </span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default ValiseHero;
