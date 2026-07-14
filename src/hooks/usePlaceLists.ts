import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

  return { lists, items, loading: user ? isLoading : false, createList, toggleItem, isSaved, reload: refetch };
}
