import { useState } from "react";
import { CalendarPlus, Check, Heart, MapPin, Navigation, Plus, Sparkles, Star, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categoryByKey } from "@/lib/discover";
import type { Place } from "@/hooks/useDiscover";
import { usePlaceLists } from "@/hooks/usePlaceLists";
import { toast } from "sonner";
import ReviewsSection from "./ReviewsSection";
import RatingsSection from "./RatingsSection";
import { Separator } from "@/components/ui/separator";
import AddToItineraryDialog from "./AddToItineraryDialog";

interface Props {
  place: Place | null;
  onClose: () => void;
}

const PlaceDetailDrawer = ({ place, onClose }: Props) => {
  const { t } = useTranslation();
  const { lists, items, toggleItem, createList, isSaved } = usePlaceLists();
  const [itineraryOpen, setItineraryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  if (!place) return null;
  const cat = categoryByKey(place.category);

  const savedListIds = new Set(
    items.filter((i) => i.place_id === place.id).map((i) => i.list_id),
  );

  const handleToggle = async (listId: string, listLabel: string) => {
    const added = await toggleItem(listId, place.id);
    toast.success(
      added
        ? t("discoverComp.drawer.savedTo", { name: listLabel })
        : t("discoverComp.drawer.removed", { name: listLabel }),
    );
  };

  const handleCreate = async () => {
    const name = newListName.trim();
    if (!name) return;
    const created = await createList(name);
    setNewListName("");
    if (created) {
      toast.success(t("discoverComp.drawer.listCreated"));
      await handleToggle(created.id, `${created.emoji ?? "📍"} ${created.name}`);
    }
  };

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

  return (
    <Drawer open={!!place} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[92vh]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto">
          <DrawerClose
            aria-label={t("discoverComp.drawer.close")}
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
          >
            <X className="h-5 w-5" />
          </DrawerClose>
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
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant={isSaved(place.id) ? "default" : "outline"}>
                    <Heart className={`mr-2 h-4 w-4 ${isSaved(place.id) ? "fill-current" : ""}`} />
                    {isSaved(place.id) ? t("discoverComp.drawer.saved") : t("discoverComp.drawer.save")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-2">
                  <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("discoverComp.drawer.chooseList")}
                  </div>
                  <div className="max-h-56 space-y-0.5 overflow-y-auto">
                    {lists.map((l) => {
                      const checked = savedListIds.has(l.id);
                      return (
                        <button
                          key={l.id}
                          onClick={() => handleToggle(l.id, `${l.emoji ?? "📍"} ${l.name}`)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition hover:bg-muted"
                        >
                          <span className="text-base">{l.emoji ?? "📍"}</span>
                          <span className="flex-1 truncate">{l.name}</span>
                          {checked && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                    {lists.length === 0 && (
                      <p className="px-2 py-3 text-xs text-muted-foreground">{t("discoverComp.drawer.noListErr")}</p>
                    )}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center gap-1.5 px-1 pb-1">
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                      placeholder={t("discoverComp.drawer.newListPlaceholder")}
                      className="h-8 text-sm"
                    />
                    <Button size="sm" onClick={handleCreate} disabled={!newListName.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
            <RatingsSection placeId={place.id} />
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
