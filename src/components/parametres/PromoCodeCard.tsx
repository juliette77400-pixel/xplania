import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { redeemPromoCode } from "@/lib/promo-code";
import { formatDay } from "@/lib/format-date";

/** Settings: enter the beta code after signing up, and see until when it is active. */
export default function PromoCodeCard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const access = useQuery({
    queryKey: ["beta-access", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("beta_access").select("expires_at").eq("user_id", user!.id).maybeSingle();
      return data && new Date(data.expires_at) > new Date() ? data.expires_at : null;
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    const r = await redeemPromoCode(code);
    setBusy(false);
    if (r.ok) {
      toast.success(t("promo.applied"));
      setCode("");
      void qc.invalidateQueries();
    } else toast.error(t(`promo.${r.reason === "expired" ? "expired" : r.reason === "invalid" ? "invalid" : "error"}`));
  };

  return (
    <Card className="p-6 space-y-3">
      <h2 className="flex items-center gap-2 font-bold"><Ticket className="h-4 w-4 text-primary" aria-hidden />{t("promo.title")}</h2>
      {access.data ? (
        <p className="text-sm text-success">{t("promo.active", { date: formatDay(access.data, i18n.language) })}</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="promo-settings">{t("promo.label")}</Label>
            <Input id="promo-settings" value={code} maxLength={40} autoComplete="off" onChange={(e) => setCode(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy || !code.trim()}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{t("promo.apply")}</Button>
        </form>
      )}
      <p className="text-xs text-muted-foreground">{t("promo.note")}</p>
    </Card>
  );
}
