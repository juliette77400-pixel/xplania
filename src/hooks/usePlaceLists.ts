import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PlaceList {
  id: string;
  name: string;
  emoji: string | null;
  is_default: boolean;
}

export interface ListItem {
  id: string;
  list_id: string;
  place_id: string;
  note: string | null;
  added_at: string;
}

export function usePlaceLists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<PlaceList[]>([]);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: l }, { data: it }] = await Promise.all([
      supabase.from("place_lists").select("*").order("created_at", { ascending: false }),
      supabase.from("place_list_items").select("*"),
    ]);
    if (l && l.length === 0) {
      // Create default list
      const { data: created } = await supabase.from("place_lists").insert({ user_id: user.id, name: "Mes favoris", emoji: "❤️", is_default: true }).select().single();
      if (created) setLists([created as PlaceList]);
    } else if (l) {
      setLists(l as PlaceList[]);
    }
    setItems((it as ListItem[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createList = useCallback(async (name: string, emoji = "📍") => {
    if (!user) return;
    const { data } = await supabase.from("place_lists").insert({ user_id: user.id, name, emoji, is_default: false }).select().single();
    if (data) setLists((p) => [data as PlaceList, ...p]);
    return data as PlaceList | null;
  }, [user]);

  const toggleItem = useCallback(async (listId: string, placeId: string) => {
    if (!user) return;
    const exists = items.find((i) => i.list_id === listId && i.place_id === placeId);
    if (exists) {
      await supabase.from("place_list_items").delete().eq("id", exists.id);
      setItems((p) => p.filter((i) => i.id !== exists.id));
      return false;
    }
    const { data } = await supabase.from("place_list_items").insert({ list_id: listId, place_id: placeId, user_id: user.id }).select().single();
    if (data) setItems((p) => [...p, data as ListItem]);
    return true;
  }, [items, user]);

  const isSaved = useCallback((placeId: string) => items.some((i) => i.place_id === placeId), [items]);

  return { lists, items, loading, createList, toggleItem, isSaved, reload: load };
}
