import { useEffect, useState, useCallback } from "react";
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

export function useInAppNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("discover_notifications")
      .select("id,title,body,type,sent_at,read_at,place_id")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(20);
    setItems((data || []) as InAppNotification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "discover_notifications", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refresh]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("discover_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    refresh();
  }, [user, refresh]);

  return { items, unreadCount, loading, markAllRead, refresh };
}
