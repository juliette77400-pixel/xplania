import { Heart, MapPin, Clock, Gem, Lightbulb, Navigation, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MoodPlace } from "@/hooks/useMoodExplorer";

interface Props {
  place: MoodPlace;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenDetails?: () => void;
  fullscreen?: boolean;
}

const MoodPlaceCard = ({ place, isFavorite, onToggleFavorite, onOpenDetails, fullscreen }: Props) => {
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
        "relative rounded-3xl overflow-hidden border border-border bg-card shadow-xl flex flex-col",
        fullscreen ? "min-h-[70vh]" : "min-h-[420px]",
      )}
    >
      {/* Image AU-DESSUS de la description (image-first card design) */}
      <div className={cn(
        "relative w-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 shrink-0",
        fullscreen ? "h-[40vh]" : "h-56",
      )}>
        {place.image_url ? (
          <img
            src={place.image_url}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl opacity-30">
            🌍
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

        {/* Top badges over image */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
          <div className="flex flex-wrap gap-1.5">
            {place.hidden_gem && (
              <Badge className="bg-amber-500/90 text-amber-50 border-0 backdrop-blur-sm">
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
              isFavorite ? "bg-rose-500 border-rose-400 text-white" : "bg-background/60 border-border text-foreground hover:bg-background/80",
            )}
            aria-label="Favori"
          >
            <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Content BELOW image */}
      <div className="p-5 space-y-3 flex-1 flex flex-col">
        <h3 className="text-2xl font-bold leading-tight">{place.name}</h3>

        <p className="text-base italic text-foreground/90 leading-snug">
          "{place.why_fits}"
        </p>

        {place.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{place.description}</p>
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
          <div className="flex gap-2 text-xs bg-muted/40 border border-border rounded-lg p-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-foreground/80">{place.tips}</span>
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-2">
          <Button onClick={openMaps} className="flex-1" size="sm">
            <Navigation className="w-4 h-4 mr-2" /> Y aller
          </Button>
          {onOpenDetails && (
            <Button onClick={onOpenDetails} variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-1" /> Vibes
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MoodPlaceCard;
