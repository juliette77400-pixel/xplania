import { motion } from "framer-motion";
import { CloudSun, MapPin, Sparkles, Calendar } from "lucide-react";
import { useDestinationImage } from "@/hooks/useDestinationImage";

interface ValiseHeroProps {
  destination: string;
  days: number;
  onGenerate: () => void;
  isGenerating: boolean;
}

const ValiseHero = ({ destination, days, onGenerate, isGenerating }: ValiseHeroProps) => {
  const heroSrc = useDestinationImage(destination, 1200, 800);

  return (
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
            ta valise pour {destination}
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md">
            Xplania analyse la météo réelle, la culture locale et ton style de voyage
            pour générer une valise parfaitement adaptée en quelques secondes.
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
              { icon: <CloudSun className="w-3.5 h-3.5" />, label: "Météo réelle analysée" },
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

        {/* Right image — destination-aware */}
        <div className="w-full md:w-2/5 relative min-h-[240px] md:min-h-[340px]">
          <img
            src={heroSrc}
            alt={`Vue de ${destination}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/20 to-background/80 md:bg-gradient-to-r md:from-background/60 md:via-transparent md:to-transparent" />
          {/* Floating info chips */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end">
            <span className="px-3 py-1.5 rounded-lg bg-background/85 backdrop-blur text-xs font-semibold text-foreground inline-flex items-center gap-1.5 shadow-md">
              <MapPin className="w-3 h-3 text-primary" /> {destination}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-background/85 backdrop-blur text-xs font-semibold text-foreground inline-flex items-center gap-1.5 shadow-md">
              <Calendar className="w-3 h-3 text-primary" /> {days} jours
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ValiseHero;
