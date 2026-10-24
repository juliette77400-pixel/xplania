// Saved homes and checked housing steps for one trip (rows are private to their owner).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

export type HousingOption = Database["public"]["Tables"]["housing_options"]["Row"];
export type HousingOptionInput = Omit<HousingOption, "id" | "user_id" | "trip_id" | "created_at" | "updated_at">;

export function useHousingOptions(tripId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["housing-options", tripId];

  const query = useQuery({
    queryKey: key,
    enabled: !!tripId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("housing_options")
        .select("*")
        .eq("trip_id", tripId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as HousingOption[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const save = useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: HousingOptionInput }) => {
      if (!user || !tripId) throw new Error("no session");
      if (id) {
        const { error } = await supabase.from("housing_options").update(values).eq("id", id).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("housing_options").insert({ ...values, user_id: user.id, trip_id: tripId });
        if (error) throw error;
      }
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("no session");
      const { error } = await supabase.from("housing_options").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  /** Only one favourite per trip: the chosen home is the one sent to the budget. */
  const setFavorite = useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      if (!user || !tripId) throw new Error("no session");
      if (favorite) {
        const { error: e1 } = await supabase.from("housing_options").update({ is_favorite: false }).eq("trip_id", tripId).eq("user_id", user.id).neq("id", id);
        if (e1) throw e1;
      }
      const { error } = await supabase.from("housing_options").update({ is_favorite: favorite }).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { options: query.data ?? [], loading: query.isLoading, error: query.error, refetch: query.refetch, save, remove, setFavorite };
}

export function useHousingChecklist(tripId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["housing-checklist", tripId];

  const query = useQuery({
    queryKey: key,
    enabled: !!tripId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("housing_checklist").select("item").eq("trip_id", tripId!);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.item));
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ item, done }: { item: string; done: boolean }) => {
      if (!user || !tripId) throw new Error("no session");
      if (done) {
        const { error } = await supabase.from("housing_checklist").upsert({ user_id: user.id, trip_id: tripId, item }, { onConflict: "trip_id,item" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("housing_checklist").delete().eq("trip_id", tripId).eq("item", item).eq("user_id", user.id);
        if (error) throw error;
      }
    },
    onMutate: async ({ item, done }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Set<string>>(key);
      const next = new Set(prev ?? []);
      if (done) next.add(item); else next.delete(item);
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { checked: query.data ?? new Set<string>(), loading: query.isLoading, error: query.error, toggle };
}
