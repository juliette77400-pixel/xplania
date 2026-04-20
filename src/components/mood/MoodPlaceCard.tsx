import { Heart, MapPin, Clock, Gem, Lightbulb, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MoodPlace } from "@/hooks/useMoodExplorer";

interface Props {
  place: MoodPlace;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  fullscreen?: boolean;
}

const MoodPlaceCard = ({ place, isFavorite, onToggleFavorite, fullscreen }: Props) => {
  const openMaps = () => {
    const q = place.lat && place.lng
      ? `${place.lat},${place.lng}`
      : encodeURIComponent(place.name);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-3xl overflow-hidden border border-border bg-card shadow-xl",
        fullscreen ? "h-[70vh]" : "h-[420px]",
      )}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: place.image_url ? `url(${place.image_url})` : undefined }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

      {/* Top badges */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
        <div className="flex flex-wrap gap-1.5">
          {place.hidden_gem && (
            <Badge className="bg-amber-500/90 text-amber-50 border-0">
              <Gem className="w-3 h-3 mr-1" /> Hidden gem
            </Badge>
          )}
          {place.category && (
            <Badge variant="secondary" className="capitalize backdrop-blur-sm">{place.category}</Badge>
          )}
        </div>
        <button
          onClick={onToggleFavorite}
          className={cn(
            "rounded-full w-10 h-10 flex items-center justify-center backdrop-blur-md border transition-all",
            isFavorite ? "bg-rose-500 border-rose-400 text-white" : "bg-background/40 border-border text-foreground hover:bg-background/60",
          )}
          aria-label="Favori"
        >
          <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
        </button>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3 z-10">
        <h3 className="text-2xl font-bold leading-tight">{place.name}</h3>

        <p className="text-base italic text-foreground/90 leading-snug">
          “{place.why_fits}”
        </p>

        {place.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{place.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {place.tags?.slice(0, 4).map((t) => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
              #{t}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {place.distance_km != null && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {place.distance_km.toFixed(1)} km</span>
          )}
          {place.duration_min != null && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {place.duration_min} min</span>
          )}
          <span className="ml-auto font-medium text-primary">{place.score}/100</span>
        </div>

        {place.tips && (
          <div className="flex gap-2 text-xs bg-muted/40 backdrop-blur-sm border border-border rounded-lg p-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-foreground/80">{place.tips}</span>
          </div>
        )}

        <Button onClick={openMaps} className="w-full" size="sm">
          <Navigation className="w-4 h-4 mr-2" /> Y aller
        </Button>
      </div>
    </motion.div>
  );
};

export default MoodPlaceCard;
