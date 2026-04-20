import { Heart, MapPin, Clock, Gem, Lightbulb, Navigation, ExternalLink, Tag } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import SocialReactions from "./SocialReactions";
import type { MoodPlace } from "@/hooks/useMoodExplorer";
import { moodByKey } from "@/lib/moods";

interface Props {
  place: MoodPlace | null;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onSharedReaction?: () => void;
}

const MoodPlaceDetail = ({ place, isFavorite, onClose, onToggleFavorite, onSharedReaction }: Props) => {
  if (!place) return null;
  const mood = moodByKey(place.mood);

  const mapsUrl =
    place.lat && place.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
  const embedSrc =
    place.lat && place.lng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${place.lng - 0.005},${place.lat - 0.003},${place.lng + 0.005},${place.lat + 0.003}&layer=mapnik&marker=${place.lat},${place.lng}`
      : null;

  return (
    <Drawer open={!!place} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[92vh]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto">
          {/* Hero image */}
          <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
            {place.image_url ? (
              <img src={place.image_url} alt={place.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-7xl opacity-60">{mood?.emoji ?? "📍"}</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {mood && (
                  <Badge className="bg-background/70 backdrop-blur-md text-foreground border-border">
                    {mood.emoji} {mood.label}
                  </Badge>
                )}
                {place.hidden_gem && (
                  <Badge className="bg-amber-500/90 text-amber-50 border-0">
                    <Gem className="w-3 h-3 mr-1" /> Hidden gem
                  </Badge>
                )}
                {place.category && (
                  <Badge variant="secondary" className="capitalize backdrop-blur-sm">
                    {place.category}
                  </Badge>
                )}
              </div>
              <button
                onClick={onToggleFavorite}
                className={cn(
                  "rounded-full w-10 h-10 flex items-center justify-center backdrop-blur-md border transition-all",
                  isFavorite
                    ? "bg-rose-500 border-rose-400 text-white"
                    : "bg-background/40 border-border text-foreground hover:bg-background/60",
                )}
                aria-label="Favori"
              >
                <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
              </button>
            </div>
          </div>

          <DrawerHeader className="space-y-2">
            <DrawerTitle className="text-2xl leading-tight">{place.name}</DrawerTitle>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {place.distance_km != null && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {place.distance_km < 1 ? `${(place.distance_km * 1000).toFixed(0)} m` : `${place.distance_km.toFixed(1)} km`}
                </span>
              )}
              {place.duration_min != null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {place.duration_min} min
                </span>
              )}
              <span className="ml-auto text-primary font-semibold">{place.score}/100</span>
            </div>
          </DrawerHeader>

          <div className="space-y-4 px-4 pb-6">
            {place.why_fits && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm italic text-foreground">✨ {place.why_fits}</p>
              </div>
            )}

            {place.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{place.description}</p>
            )}

            {place.tips && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-500">
                  <Lightbulb className="w-3.5 h-3.5" /> Tip insider
                </div>
                <p className="text-sm">{place.tips}</p>
              </div>
            )}

            {place.tags && place.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground self-center" />
                {place.tags.slice(0, 8).map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Mini map */}
            {embedSrc && (
              <div className="rounded-xl overflow-hidden border border-border h-48">
                <iframe
                  src={embedSrc}
                  title="Mini-carte"
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button asChild className="w-full">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="w-4 h-4 mr-1.5" /> Y aller
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href={searchUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Voir sur Maps
                </a>
              </Button>
            </div>

            <Separator />
            <SocialReactions place={place} onShared={onSharedReaction} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MoodPlaceDetail;
