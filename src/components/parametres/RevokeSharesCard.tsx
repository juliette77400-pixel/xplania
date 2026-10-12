// Lets the user disable every public share link at once (journals, live tracking, place lists).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link2Off, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const RevokeSharesCard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const revoke = async () => {
    if (!user) return;
    if (!window.confirm(t("settings.revokeShares.confirm"))) return;
    setLoading(true);
    const results = await Promise.all([
      supabase.from("journals").update({ is_public: false }).eq("user_id", user.id),
      supabase.from("trip_tracking").update({ share_enabled: false }).eq("user_id", user.id),
      supabase.from("place_lists").update({ is_public: false }).eq("user_id", user.id),
    ]);
    setLoading(false);
    if (results.some((r) => r.error)) toast.error(t("settings.revokeShares.error"));
    else toast.success(t("settings.revokeShares.done"));
  };

  return (
    <Card className="p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Link2Off className="w-4 h-4 text-primary" />
        <h2 className="font-semibold">{t("settings.revokeShares.title")}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{t("settings.revokeShares.desc")}</p>
      <Button variant="outline" onClick={revoke} disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {t("settings.revokeShares.button")}
      </Button>
    </Card>
  );
};

export default RevokeSharesCard;
