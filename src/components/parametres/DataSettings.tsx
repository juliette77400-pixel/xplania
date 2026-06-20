// Données tab — RGPD export + account deletion.
// Export: aggregate the calling user's rows from public tables into a JSON file.
// Delete: edge function `delete-account` removes the auth user (cascades public data).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Tables that store user-owned rows scoped by user_id.
// Kept conservative: only tables you would expect to find in a personal export.
const EXPORT_TABLES = [
  "profiles",
  "trips",
  "trip_activities",
  "trip_tracking",
  "trip_checkins",
  "trip_documents",
  "trip_positions",
  "trip_alerts",
  "alert_subscriptions",
  "journals",
  "journal_days",
  "journal_blocks",
  "journal_badges",
  "journal_stories",
  "mood_entries",
  "mood_favorites",
  "mood_selections",
  "mood_reactions",
  "place_lists",
  "place_list_items",
  "place_ratings",
  "place_reviews",
  "gam_badge_claims",
  "gam_user_settings",
  "gam_user_category_prefs",
  "explore_progress",
  "explore_badges",
  "discover_notifications",
  "pip_chat_sessions",
] as const;

const DataSettings = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const bundle: Record<string, any> = {
        exported_at: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        tables: {},
      };

      for (const tbl of EXPORT_TABLES) {
        // Most tables use user_id; profiles uses user_id too in this project.
        const { data, error } = await supabase
          .from(tbl as any)
          .select("*")
          .eq("user_id", user.id);
        if (error) {
          bundle.tables[tbl] = { error: error.message };
        } else {
          bundle.tables[tbl] = data ?? [];
        }
      }

      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xplania-export-${user.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("settings.data.export.success"));
    } catch (e: any) {
      toast.error(e?.message ?? String(e));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account", {
        body: { confirm: "DELETE" },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t("settings.data.delete.success"));
      await signOut();
      window.location.href = "/";
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("settings.data.export.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.data.export.hint")}</p>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {t("settings.data.export.cta")}
        </Button>
      </Card>

      <Card className="p-6 space-y-4 border-destructive/40">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-destructive" />
          <h2 className="font-semibold text-destructive">{t("settings.data.delete.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.data.delete.hint")}</p>

        <AlertDialog
          onOpenChange={(open) => {
            if (!open) setConfirmText("");
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              {t("settings.data.delete.cta")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("settings.data.delete.confirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("settings.data.delete.confirmDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                {t("settings.data.delete.typeToConfirm", { word: "SUPPRIMER" })}
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                disabled={confirmText !== "SUPPRIMER" || deleting}
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("settings.data.delete.confirmCta")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
};

export default DataSettings;
