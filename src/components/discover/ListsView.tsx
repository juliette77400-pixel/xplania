import { Heart, Trash2, FileDown, Mail, Share2, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePlaceLists } from "@/hooks/usePlaceLists";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Place } from "@/hooks/useDiscover";
import PlaceCard from "./PlaceCard";
import { exportListToPDF, shareListByEmail, shareListNative, copyListToClipboard } from "@/lib/discover-export";
import { toast } from "sonner";

interface Props { onSelect: (p: Place) => void; }

const ListsView = ({ onSelect }: Props) => {
  const { t } = useTranslation();
  const { lists, items, toggleItem, createList } = usePlaceLists();
  const [places, setPlaces] = useState<Place[]>([]);
  const [creatingName, setCreatingName] = useState("");

  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.place_id)));
    if (ids.length === 0) { setPlaces([]); return; }
    supabase.from("places").select("*").in("id", ids).then(({ data }) => setPlaces((data as Place[]) || []));
  }, [items]);

  const handleShare = async (name: string, emoji: string | null, listPlaces: Place[]) => {
    if (listPlaces.length === 0) return toast.error(t("discoverComp.lists.emptyError"));
    const ok = await shareListNative({ name, emoji, places: listPlaces });
    if (!ok) {
      await copyListToClipboard({ name, emoji, places: listPlaces });
      toast.success(t("discoverComp.lists.copied"));
    }
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
        const listItems = items.filter((i) => i.list_id === list.id);
        const listPlaces = listItems.map((i) => places.find((p) => p.id === i.place_id)).filter(Boolean) as Place[];
        const exportPayload = { name: list.name, emoji: list.emoji, places: listPlaces };
        return (
          <section key={list.id} className="space-y-3 rounded-2xl border border-border/50 bg-card/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <span>{list.emoji || "📍"}</span>{list.name}
                <span className="text-xs font-normal text-muted-foreground">({listPlaces.length})</span>
              </h2>
              {listPlaces.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => { exportListToPDF(exportPayload); toast.success(t("discoverComp.lists.pdfDownloaded")); }}>
                    <FileDown className="mr-1.5 h-3.5 w-3.5" />PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareListByEmail(exportPayload)}>
                    <Mail className="mr-1.5 h-3.5 w-3.5" />{t("discoverComp.lists.email")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleShare(list.name, list.emoji, listPlaces)}>
                    <Share2 className="mr-1.5 h-3.5 w-3.5" />{t("discoverComp.lists.share")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={async () => { await copyListToClipboard(exportPayload); toast.success(t("discoverComp.lists.copiedShort")); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            {listPlaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("discoverComp.lists.empty")}</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {listPlaces.map((p) => (
                  <div key={p.id} className="relative">
                    <PlaceCard place={p} onClick={() => onSelect(p)} />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleItem(list.id, p.id); }}
                      className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-destructive/80 text-destructive-foreground transition hover:bg-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
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
    </div>
  );
};

export default ListsView;
