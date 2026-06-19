import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type Settings = {
  id: string;
  geo_auto_validate: boolean;
  exif_auto_validate: boolean;
  ai_auto_validate_threshold: number;
  ai_auto_reject_threshold: number;
  force_manual_review: boolean;
};

export default function VerificationSettingsPanel() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gam_verification_settings")
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
    const v = Math.max(0, Math.min(1, Number(s.ai_auto_validate_threshold)));
    const r = Math.max(0, Math.min(1, Number(s.ai_auto_reject_threshold)));
    const { error } = await supabase
      .from("gam_verification_settings")
      .update({
        geo_auto_validate: s.geo_auto_validate,
        exif_auto_validate: s.exif_auto_validate,
        ai_auto_validate_threshold: v,
        ai_auto_reject_threshold: r,
        force_manual_review: s.force_manual_review,
      })
      .eq("id", "default");
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Réglages enregistrés ✓");
    load();
  };

  if (loading) return <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-primary" /></div>;
  if (!s) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div>
        <h2 className="text-lg font-bold">Règles de vérification automatique</h2>
        <p className="text-xs text-muted-foreground">
          Ajuste les seuils utilisés par la fonction de vérification. Affecte toutes les nouvelles réclamations.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-sm">Valider auto. par géolocalisation</Label>
          <p className="text-[11px] text-muted-foreground">Auto-validation si l'utilisateur est dans le rayon du badge.</p>
        </div>
        <Switch checked={s.geo_auto_validate} onCheckedChange={(v) => setS({ ...s, geo_auto_validate: v })} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-sm">Valider auto. par EXIF photo</Label>
          <p className="text-[11px] text-muted-foreground">Auto-validation si le GPS de la photo correspond.</p>
        </div>
        <Switch checked={s.exif_auto_validate} onCheckedChange={(v) => setS({ ...s, exif_auto_validate: v })} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vth" className="text-sm">Seuil IA de validation (0–1)</Label>
          <Input
            id="vth" type="number" min={0} max={1} step={0.05}
            value={s.ai_auto_validate_threshold}
            onChange={(e) => setS({ ...s, ai_auto_validate_threshold: Number(e.target.value) })}
          />
          <p className="text-[11px] text-muted-foreground mt-1">Verdict IA "validated" et confiance ≥ ce seuil → auto-validation.</p>
        </div>
        <div>
          <Label htmlFor="rth" className="text-sm">Seuil IA de rejet (0–1)</Label>
          <Input
            id="rth" type="number" min={0} max={1} step={0.05}
            value={s.ai_auto_reject_threshold}
            onChange={(e) => setS({ ...s, ai_auto_reject_threshold: Number(e.target.value) })}
          />
          <p className="text-[11px] text-muted-foreground mt-1">Verdict IA "rejected" et confiance ≥ ce seuil → auto-rejet.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <div>
          <Label className="text-sm">Forcer la modération manuelle</Label>
          <p className="text-[11px] text-muted-foreground">Aucune auto-validation ni auto-rejet. Toutes les preuves passent par l'admin.</p>
        </div>
        <Switch checked={s.force_manual_review} onCheckedChange={(v) => setS({ ...s, force_manual_review: v })} />
      </div>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Enregistrer
      </Button>
    </div>
  );
}
