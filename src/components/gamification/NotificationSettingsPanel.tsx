import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Bell } from "lucide-react";
import { toast } from "sonner";

type Settings = {
  id: string;
  enabled_validated: boolean;
  enabled_rejected: boolean;
  channel_in_app: boolean;
  channel_email: boolean;
  frequency: "instant" | "daily";
};

export default function NotificationSettingsPanel() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gam_notification_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (error) toast.error(error.message);
    setS((data as any) || null);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    const { error } = await supabase
      .from("gam_notification_settings")
      .update({
        enabled_validated: s.enabled_validated,
        enabled_rejected: s.enabled_rejected,
        channel_in_app: s.channel_in_app,
        channel_email: s.channel_email,
        frequency: s.frequency,
      })
      .eq("id", "default");
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Notifications mises à jour ✓");
    load();
  };

  if (loading) return <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-primary" /></div>;
  if (!s) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" /> Notifications de transitions
        </h2>
        <p className="text-xs text-muted-foreground">
          Quand une réclamation passe d'« en attente » à « validée » ou « rejetée », ces réglages contrôlent l'envoi de notifications aux voyageurs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label className="text-sm">Notifier sur « validée »</Label>
          <Switch checked={s.enabled_validated} onCheckedChange={(v) => setS({ ...s, enabled_validated: v })} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label className="text-sm">Notifier sur « rejetée »</Label>
          <Switch checked={s.enabled_rejected} onCheckedChange={(v) => setS({ ...s, enabled_rejected: v })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label className="text-sm">Canal : in-app</Label>
            <p className="text-[11px] text-muted-foreground">Cloche de notification de l'app.</p>
          </div>
          <Switch checked={s.channel_in_app} onCheckedChange={(v) => setS({ ...s, channel_in_app: v })} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3 opacity-80">
          <div>
            <Label className="text-sm">Canal : email</Label>
            <p className="text-[11px] text-muted-foreground">Bientôt — file d'envoi prête côté serveur.</p>
          </div>
          <Switch checked={s.channel_email} onCheckedChange={(v) => setS({ ...s, channel_email: v })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-3">
          <Label className="text-sm">Fréquence</Label>
          <Select value={s.frequency} onValueChange={(v: "instant" | "daily") => setS({ ...s, frequency: v })}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instantanée</SelectItem>
              <SelectItem value="daily">Récap quotidien (bientôt)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground mt-1">Seul l'envoi instantané est actif aujourd'hui.</p>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Enregistrer
      </Button>
    </div>
  );
}
