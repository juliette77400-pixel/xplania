import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface InAppNotification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  sent_at: string;
  read_at: string | null;
  place_id: string | null;
}

export const inAppNotificationsQueryKey = (userId: string | undefined) =>
  ["discover_notifications", userId] as const;

export function useInAppNotifications() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: inAppNotificationsQueryKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("discover_notifications")
        .select("id,title,body,type,sent_at,read_at,place_id")
        .eq("user_id", user!.id)
        .order("sent_at", { ascending: false })
        .limit(20);
      return (data || []) as InAppNotification[];
    },
  });

  const items = data ?? [];

  // Realtime: refetch when a new notification arrives.
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "discover_notifications", filter: `user_id=eq.${user.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, refetch]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("discover_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    refetch();
  }, [user, refetch]);

  return { items, unreadCount, loading: user ? isLoading : false, markAllRead, refresh: refetch };
}
