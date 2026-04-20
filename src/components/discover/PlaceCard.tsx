import { motion } from "framer-motion";
import { Heart, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categoryByKey } from "@/lib/discover";
import type { Place } from "@/hooks/useDiscover";

interface Props {
  place: Place;
  onClick?: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
}

const PlaceCard = ({ place, onClick, saved, onToggleSave }: Props) => {
  const cat = categoryByKey(place.category);
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative w-[260px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card text-left shadow-md backdrop-blur-sm"
    >
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {place.image_url ? (
          <img src={place.image_url} alt={place.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl opacity-60">{cat?.emoji ?? "📍"}</div>
        )}
        {place.hidden_gem && (
          <Badge className="absolute left-2 top-2 gap-1 border-0 bg-accent text-accent-foreground">
            <Sparkles className="h-3 w-3" /> Hidden gem
          </Badge>
        )}
        {onToggleSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
            className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-background/70 backdrop-blur transition hover:bg-background"
            aria-label={saved ? "Retirer" : "Sauvegarder"}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : "text-foreground"}`} />
          </button>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{cat?.emoji}</span><span>{cat?.label || place.category}</span>
          {place.distance_km != null && <><span>•</span><span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{place.distance_km < 1 ? `${(place.distance_km * 1000).toFixed(0)} m` : `${place.distance_km.toFixed(1)} km`}</span></>}
        </div>
        <h3 className="line-clamp-1 font-semibold">{place.name}</h3>
        {place.why_fits && <p className="line-clamp-2 text-xs italic text-muted-foreground">"{place.why_fits}"</p>}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {(place.tags || []).slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">#{t}</span>
          ))}
        </div>
      </div>
    </motion.button>
  );
};

export default PlaceCard;
