import { useState } from "react";
import { CalendarPlus, Heart, MapPin, Navigation, Sparkles, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categoryByKey } from "@/lib/discover";
import type { Place } from "@/hooks/useDiscover";
import { usePlaceLists } from "@/hooks/usePlaceLists";
import { toast } from "sonner";
import ReviewsSection from "./ReviewsSection";
import { Separator } from "@/components/ui/separator";
import AddToItineraryDialog from "./AddToItineraryDialog";

interface Props {
  place: Place | null;
  onClose: () => void;
}

const PlaceDetailDrawer = ({ place, onClose }: Props) => {
  const { t } = useTranslation();
  const { lists, isSaved, toggleItem } = usePlaceLists();
  const [itineraryOpen, setItineraryOpen] = useState(false);
  if (!place) return null;
  const cat = categoryByKey(place.category);
  const defaultList = lists.find((l) => l.is_default) || lists[0];

  const handleSave = async () => {
    if (!defaultList) return toast.error(t("discoverComp.drawer.noListErr"));
    const added = await toggleItem(defaultList.id, place.id);
    toast.success(added
      ? t("discoverComp.drawer.savedTo", { name: `${defaultList.emoji ?? ""} ${defaultList.name}`.trim() })
      : t("discoverComp.drawer.removed"));
  };
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

  return (
    <Drawer open={!!place} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[92vh]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto">
          <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/30">
            {place.image_url ? <img src={place.image_url} alt={place.name} className="h-full w-full object-cover" /> : (
              <div className="grid h-full place-items-center text-7xl opacity-60">{cat?.emoji ?? "📍"}</div>
            )}
            {place.hidden_gem && (
              <Badge className="absolute left-3 top-3 gap-1 border-0 bg-accent text-accent-foreground">
                <Sparkles className="h-3 w-3" /> {t("discoverComp.card.hiddenGem")}
              </Badge>
            )}
          </div>
          <DrawerHeader className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{cat?.emoji} {cat?.label || place.category}</span>
              {place.distance_km != null && <><span>•</span><span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{place.distance_km < 1 ? `${(place.distance_km * 1000).toFixed(0)} m` : `${place.distance_km.toFixed(1)} km`}</span></>}
              {place.rating_count > 0 && <><span>•</span><span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-current" />{place.rating_avg.toFixed(1)} ({place.rating_count})</span></>}
            </div>
            <DrawerTitle className="text-2xl">{place.name}</DrawerTitle>
            {place.why_fits && (
              <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm italic text-foreground">
                ✨ {place.why_fits}
              </p>
            )}
          </DrawerHeader>

          <div className="space-y-4 px-4 pb-6">
            {place.description && <p className="text-sm text-muted-foreground">{place.description}</p>}
            {place.address && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{place.address}</p>}
            {place.tips && (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">{t("discoverComp.drawer.tipInsider")}</div>
                <p className="text-sm">{place.tips}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {(place.tags || []).map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">#{tag}</span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button onClick={handleSave} variant={isSaved(place.id) ? "default" : "outline"}>
                <Heart className={`mr-2 h-4 w-4 ${isSaved(place.id) ? "fill-current" : ""}`} />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button onClick={handleSave} variant={isSaved(place.id) ? "default" : "outline"}>
                <Heart className={`mr-2 h-4 w-4 ${isSaved(place.id) ? "fill-current" : ""}`} />
                {isSaved(place.id) ? t("discoverComp.drawer.saved") : t("discoverComp.drawer.save")}
              </Button>
              <Button asChild variant="outline">
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="mr-2 h-4 w-4" />{t("discoverComp.drawer.directions")}
                </a>
              </Button>
            </div>
            <Button className="w-full" onClick={() => setItineraryOpen(true)}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              {t("discoverComp.drawer.addToItinerary")}
            </Button>

            <Separator className="my-2" />
            <ReviewsSection placeId={place.id} />
          </div>
        </div>
      </DrawerContent>
      <AddToItineraryDialog place={place} open={itineraryOpen} onClose={() => setItineraryOpen(false)} />
    </Drawer>
  );
};

export default PlaceDetailDrawer;
