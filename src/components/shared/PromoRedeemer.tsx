// A code typed at signup travels in the account metadata (the email may be confirmed on
// another device); it is applied by the server at the first signed-in visit, then cleared.
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PROMO_META_KEY, redeemPromoCode } from "@/lib/promo-code";

export default function PromoRedeemer() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const done = useRef<string | null>(null);

  useEffect(() => {
    const code = user?.user_metadata?.[PROMO_META_KEY];
    if (!user || typeof code !== "string" || !code || done.current === user.id) return;
    done.current = user.id;
    void (async () => {
      const r = await redeemPromoCode(code);
      if (r.ok) {
        toast.success(t("promo.applied"));
        void qc.invalidateQueries();
      } else if (r.reason !== "error") {
        toast.error(t(`promo.${r.reason === "expired" ? "expired" : "invalid"}`));
      } else {
        done.current = null; // network problem: try again next time
        return;
      }
      await supabase.auth.updateUser({ data: { [PROMO_META_KEY]: null } });
    })();
  }, [user, t, qc]);

  return null;
}
