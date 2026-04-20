import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaceLists } from "@/hooks/usePlaceLists";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Place } from "@/hooks/useDiscover";
import PlaceCard from "./PlaceCard";

interface Props { onSelect: (p: Place) => void; }

const ListsView = ({ onSelect }: Props) => {
  const { lists, items, toggleItem, createList } = usePlaceLists();
  const [places, setPlaces] = useState<Place[]>([]);
  const [creatingName, setCreatingName] = useState("");

  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.place_id)));
    if (ids.length === 0) { setPlaces([]); return; }
    supabase.from("places").select("*").in("id", ids).then(({ data }) => setPlaces((data as Place[]) || []));
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={creatingName}
          onChange={(e) => setCreatingName(e.target.value)}
          placeholder="Nouvelle liste (ex: Paris food)"
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <Button onClick={async () => { if (creatingName.trim()) { await createList(creatingName.trim()); setCreatingName(""); } }} disabled={!creatingName.trim()}>
          Créer une liste
        </Button>
      </div>
      {lists.map((list) => {
        const listItems = items.filter((i) => i.list_id === list.id);
        const listPlaces = listItems.map((i) => places.find((p) => p.id === i.place_id)).filter(Boolean) as Place[];
        return (
          <section key={list.id} className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span>{list.emoji || "📍"}</span>{list.name}
              <span className="text-xs font-normal text-muted-foreground">({listPlaces.length})</span>
            </h2>
            {listPlaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">Liste vide. Sauvegarde des lieux depuis la découverte.</p>
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
          <p className="text-sm text-muted-foreground">Crée ta première liste pour organiser tes découvertes.</p>
        </div>
      )}
    </div>
  );
};

export default ListsView;
