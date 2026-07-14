import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const travelerProfileKey = (userId: string | undefined) =>
  ["traveler_profile", userId] as const;

export function useTravelerProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: travelerProfileKey(user?.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traveler_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
