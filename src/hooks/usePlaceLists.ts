import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PlaceList {
  id: string;
  name: string;
  emoji: string | null;
  is_default: boolean;
  is_public?: boolean;
  share_slug?: string | null;
}

export interface ListItem {
  id: string;
  list_id: string;
  place_id: string;
  note: string | null;
  added_at: string;
}

interface PlaceListsData {
  lists: PlaceList[];
  items: ListItem[];
}

export const placeListsQueryKey = (userId: string | undefined) =>
  ["place_lists", userId] as const;

export function usePlaceLists() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<PlaceListsData>({
    queryKey: placeListsQueryKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const [{ data: l }, { data: it }] = await Promise.all([
        supabase.from("place_lists").select("*").order("created_at", { ascending: false }),
        supabase.from("place_list_items").select("*"),
      ]);
      let lists = (l as PlaceList[]) || [];
      if (lists.length === 0) {
        // Create default list
        const { data: created } = await supabase
          .from("place_lists")
          .insert({ user_id: user!.id, name: "Mes favoris", emoji: "❤️", is_default: true })
          .select()
          .single();
        if (created) lists = [created as PlaceList];
      }
      return { lists, items: (it as ListItem[]) || [] };
    },
  });

  const lists = useMemo<PlaceList[]>(() => data?.lists ?? [], [data?.lists]);
  const items = useMemo<ListItem[]>(() => data?.items ?? [], [data?.items]);

  const setData = useCallback(
    (updater: (prev: PlaceListsData) => PlaceListsData) =>
      queryClient.setQueryData<PlaceListsData>(placeListsQueryKey(user?.id), (prev) =>
        updater(prev ?? { lists: [], items: [] }),
      ),
    [queryClient, user?.id],
  );

  const createList = useCallback(
    async (name: string, emoji = "📍") => {
      if (!user) return;
      const { data } = await supabase
        .from("place_lists")
        .insert({ user_id: user.id, name, emoji, is_default: false })
        .select()
        .single();
      if (data)
        setData((prev) => ({ ...prev, lists: [data as PlaceList, ...prev.lists] }));
      return data as PlaceList | null;
    },
    [user, setData],
  );

  const toggleItem = useCallback(
    async (listId: string, placeId: string) => {
      if (!user) return;
      const exists = items.find((i) => i.list_id === listId && i.place_id === placeId);
      if (exists) {
        await supabase.from("place_list_items").delete().eq("id", exists.id);
        setData((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== exists.id) }));
        return false;
      }
      const { data } = await supabase
        .from("place_list_items")
        .insert({ list_id: listId, place_id: placeId, user_id: user.id })
        .select()
        .single();
      if (data) setData((prev) => ({ ...prev, items: [...prev.items, data as ListItem] }));
      return true;
    },
    [items, user, setData],
  );

  const isSaved = useCallback((placeId: string) => items.some((i) => i.place_id === placeId), [items]);

  const deleteList = useCallback(
    async (listId: string) => {
      await supabase.from("place_lists").delete().eq("id", listId);
      setData((prev) => ({
        lists: prev.lists.filter((l) => l.id !== listId),
        items: prev.items.filter((i) => i.list_id !== listId),
      }));
    },
    [setData],
  );

  /** Makes a list public and returns its shareable URL. */
  const shareList = useCallback(
    async (list: PlaceList) => {
      const slug = list.share_slug || crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const { data } = await supabase
        .from("place_lists")
        .update({ is_public: true, share_slug: slug })
        .eq("id", list.id)
        .select()
        .single();
      if (data) setData((prev) => ({ ...prev, lists: prev.lists.map((l) => (l.id === list.id ? (data as PlaceList) : l)) }));
      return `${window.location.origin}/liste/${slug}`;
    },
    [setData],
  );

  /** Mood places live in their own table: copy them into `places` so they can join lists. */
  const ensureMoodPlace = useCallback(
    async (m: { id: string; name: string; category: string | null; lat: number | null; lng: number | null; description: string | null; why_fits?: string | null; tags?: string[]; image_url?: string | null; tips?: string | null; hidden_gem?: boolean }) => {
      if (!user || m.lat == null || m.lng == null) return null;
      const { data: existing } = await supabase.from("places").select("id").eq("source", "mood").eq("osm_id", m.id).maybeSingle();
      if (existing) return existing.id as string;
      const { data } = await supabase
        .from("places")
        .insert({
          source: "mood", osm_id: m.id, created_by: user.id, name: m.name,
          category: m.category || "culture", lat: m.lat, lng: m.lng,
          description: m.description, why_fits: m.why_fits ?? null, tags: m.tags ?? [],
          image_url: m.image_url ?? null, tips: m.tips ?? null, hidden_gem: !!m.hidden_gem,
        })
        .select("id")
        .single();
      return (data?.id as string) ?? null;
    },
    [user],
  );

  return { lists, items, loading: user ? isLoading : false, createList, toggleItem, isSaved, deleteList, shareList, ensureMoodPlace, reload: refetch };
}
