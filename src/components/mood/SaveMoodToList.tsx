import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ListPlus, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { usePlaceLists } from "@/hooks/usePlaceLists";
import { useAuth } from "@/hooks/useAuth";
import type { MoodPlace } from "@/hooks/useMoodExplorer";

/** Save a Mood Explorer place into one of the user's lists (shared with Découvrir). */
const SaveMoodToList = ({ place }: { place: MoodPlace }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { lists, items, toggleItem, createList, ensureMoodPlace } = usePlaceLists();
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");

  if (!user) return null;
  const saved = new Set(items.filter((i) => i.place_id === placeId).map((i) => i.list_id));

  const resolve = async () => {
    if (placeId) return placeId;
    const id = await ensureMoodPlace(place);
    if (!id) toast.error(t("gmaps.lists.noCoords"));
    setPlaceId(id);
    return id;
  };

  const toggle = async (listId: string, label: string) => {
    setBusy(true);
    try {
      const id = await resolve();
      if (!id) return;
      const added = await toggleItem(listId, id);
      toast.success(added ? t("discoverComp.drawer.savedTo", { name: label }) : t("discoverComp.drawer.removed", { name: label }));
    } finally { setBusy(false); }
  };

  return (
    <Popover onOpenChange={(o) => { if (o) void resolve(); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm"><ListPlus className="mr-1.5 h-4 w-4" />{t("gmaps.lists.addToList")}</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-2">
        {lists.map((l) => (
          <button key={l.id} disabled={busy} onClick={() => toggle(l.id, l.name)}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
            <span>{l.emoji} {l.name}</span>
            {saved.has(l.id) && <Check className="h-4 w-4 text-primary" />}
          </button>
        ))}
        <div className="flex gap-1.5 pt-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("discoverComp.lists.newPlaceholder")} className="h-8 text-xs" />
          <Button size="sm" className="h-8" disabled={!name.trim() || busy}
            onClick={async () => { const c = await createList(name.trim()); setName(""); if (c) await toggle(c.id, c.name); }}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "+"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SaveMoodToList;
