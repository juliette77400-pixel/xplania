import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MOOD_BADGES, type BadgeContext } from "@/lib/mood-badges";

export interface MoodBadge {
  id: string;
  user_id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  unlocked_at: string;
}

export function useMoodBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<MoodBadge[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mood_badges")
      .select("*")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false });
    setBadges((data as any) || []);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const evaluate = useCallback(async (ctx: BadgeContext) => {
    if (!user) return;
    const owned = new Set(badges.map((b) => b.code));
    const toUnlock = MOOD_BADGES.filter((b) => !owned.has(b.code) && b.check(ctx));
    if (toUnlock.length === 0) return;

    const rows = toUnlock.map((b) => ({
      user_id: user.id,
      code: b.code,
      name: b.name,
      description: b.description,
      icon: b.icon,
    }));
    const { data, error } = await supabase
      .from("mood_badges")
      .insert(rows)
      .select("*");
    if (error) {
      console.error(error);
      return;
    }
    setBadges((prev) => [...((data as any) || []), ...prev]);
    toUnlock.forEach((b) =>
      toast.success(`${b.icon} Badge débloqué : ${b.name}`, { description: b.description }),
    );
  }, [user, badges]);

  return { badges, evaluate, reload: load };
}
