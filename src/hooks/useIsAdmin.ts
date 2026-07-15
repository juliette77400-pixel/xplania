import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { setAdminFlag, subscribeAdmin, isAdminSync } from "@/lib/admin-access";
import { useState } from "react";

/**
 * Server-verified admin check. Calls the SECURITY DEFINER RPC
 * `is_current_user_admin()` which returns true only if the authenticated
 * user has the `admin` role in `public.user_roles`.
 *
 * The result is mirrored into the module-level flag (`admin-access.ts`)
 * so non-hook call sites can read it synchronously.
 */
export const useIsAdmin = () => {
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["is-admin", user?.id ?? "anon"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_current_user_admin");
      if (error) {
        console.warn("[useIsAdmin] rpc failed", error);
        return false;
      }
      return !!data;
    },
  });

  useEffect(() => {
    if (!user) {
      setAdminFlag(false);
      return;
    }
    if (typeof q.data === "boolean") setAdminFlag(q.data);
  }, [user, q.data]);

  return { isAdmin: !!q.data, loading: q.isLoading };
};

/** Reactive subscription for components that don't fetch themselves. */
export const useAdminFlag = (): boolean => {
  const [v, setV] = useState(isAdminSync());
  useEffect(() => subscribeAdmin(setV), []);
  return v;
};
