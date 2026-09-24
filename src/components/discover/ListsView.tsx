import { Heart, Trash2, FileDown, Mail, Link2, CalendarPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePlaceLists } from "@/hooks/usePlaceLists";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Place } from "@/hooks/useDiscover";
import PlaceCard from "./PlaceCard";
import AddToItineraryDialog from "./AddToItineraryDialog";
import { categoryByKey } from "@/lib/discover";
import { exportListToPDF, shareListByEmail } from "@/lib/discover-export";
import { toast } from "sonner";

interface Props { onSelect: (p: Place) => void; }

const ListsView = ({ onSelect }: Props) => {
  const { t } = useTranslation();
  const { lists, items, toggleItem, createList, deleteList, shareList } = usePlaceLists();
  const [places, setPlaces] = useState<Place[]>([]);
  const [creatingName, setCreatingName] = useState("");
  const [tripPlace, setTripPlace] = useState<Place | null>(null);

  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.place_id)));
    if (ids.length === 0) { setPlaces([]); return; }
    supabase.from("places").select("*").in("id", ids).then(({ data }) => setPlaces((data as Place[]) || []));
  }, [items]);

  const copyLink = async (list: (typeof lists)[number]) => {
    const url = await shareList(list);
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    toast.success(t("gmaps.lists.linkCopied"), { description: url });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={creatingName}
          onChange={(e) => setCreatingName(e.target.value)}
          placeholder={t("discoverComp.lists.newPlaceholder")}
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <Button onClick={async () => { if (creatingName.trim()) { await createList(creatingName.trim()); setCreatingName(""); } }} disabled={!creatingName.trim()}>
          {t("discoverComp.lists.create")}
        </Button>
      </div>
      {lists.map((list) => {
        const listPlaces = items.filter((i) => i.list_id === list.id)
          .map((i) => places.find((p) => p.id === i.place_id)).filter(Boolean) as Place[];
        const exportPayload = { name: list.name, emoji: list.emoji, places: listPlaces };
        const groups = new Map<string, Place[]>();
        listPlaces.forEach((p) => groups.set(p.category, [...(groups.get(p.category) || []), p]));
        return (
          <section key={list.id} className="space-y-3 rounded-2xl border border-border/50 bg-card/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <span>{list.emoji || "📍"}</span>{list.name}
                <span className="text-xs font-normal text-muted-foreground">({listPlaces.length})</span>
                {list.is_public && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">{t("gmaps.lists.public")}</span>}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {listPlaces.length > 0 && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => copyLink(list)}>
                      <Link2 className="mr-1.5 h-3.5 w-3.5" />{t("gmaps.lists.shareLink")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { exportListToPDF(exportPayload); toast.success(t("discoverComp.lists.pdfDownloaded")); }}>
                      <FileDown className="mr-1.5 h-3.5 w-3.5" />PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => shareListByEmail(exportPayload)}>
                      <Mail className="mr-1.5 h-3.5 w-3.5" />{t("discoverComp.lists.email")}
                    </Button>
                  </>
                )}
                {!list.is_default && (
                  <Button size="sm" variant="ghost" aria-label={t("gmaps.lists.deleteList")}
                    onClick={async () => { if (window.confirm(t("gmaps.lists.confirmDelete", { name: list.name }))) await deleteList(list.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            {listPlaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("discoverComp.lists.empty")}</p>
            ) : (
              Array.from(groups.entries()).map(([cat, ps]) => {
                const c = categoryByKey(cat);
                return (
                  <div key={cat} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {c?.emoji ?? "📍"} {t(`gmaps.categories.${cat}`, { defaultValue: c?.label ?? cat })} · {ps.length}
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {ps.map((p) => (
                        <div key={p.id} className="relative">
                          <PlaceCard place={p} onClick={() => onSelect(p)} />
                          <div className="absolute right-2 top-2 flex gap-1.5">
                            <button
                              aria-label={t("gmaps.lists.addToTrip")}
                              onClick={(e) => { e.stopPropagation(); setTripPlace(p); }}
                              className="grid h-9 w-9 place-items-center rounded-full bg-primary/90 text-primary-foreground transition hover:bg-primary"
                            >
                              <CalendarPlus className="h-4 w-4" />
                            </button>
                            <button
                              aria-label={t("gmaps.lists.remove")}
                              onClick={(e) => { e.stopPropagation(); toggleItem(list.id, p.id); }}
                              className="grid h-9 w-9 place-items-center rounded-full bg-destructive/80 text-destructive-foreground transition hover:bg-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        );
      })}
      {lists.length === 0 && (
        <div className="rounded-2xl border border-border bg-card/40 p-8 text-center">
          <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("discoverComp.lists.noListsTitle")}</p>
        </div>
      )}
      <AddToItineraryDialog place={tripPlace} open={!!tripPlace} onClose={() => setTripPlace(null)} />
    </div>
  );
};

export default ListsView;
