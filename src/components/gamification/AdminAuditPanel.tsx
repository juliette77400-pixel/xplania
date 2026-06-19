import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ScrollText, Settings as SettingsIcon, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: any;
  after_data: any;
  metadata: any;
  created_at: string;
  actor_name?: string | null;
};

const ACTION_LABEL: Record<string, string> = {
  update_settings: "Modif. règles de vérification",
  manual_decision_validated: "Validation manuelle",
  manual_decision_rejected: "Rejet manuel",
};

function diffSettings(before: any, after: any): string[] {
  if (!before || !after) return [];
  const keys = [
    "geo_auto_validate",
    "exif_auto_validate",
    "ai_auto_validate_threshold",
    "ai_auto_reject_threshold",
    "force_manual_review",
  ];
  const out: string[] = [];
  for (const k of keys) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      out.push(`${k}: ${JSON.stringify(before[k])} → ${JSON.stringify(after[k])}`);
    }
  }
  return out;
}

export default function AdminAuditPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "settings" | "decisions">("all");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("gam_admin_audit").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter === "settings") q = q.eq("entity_type", "gam_verification_settings");
    if (filter === "decisions") q = q.eq("entity_type", "gam_badge_claim");
    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const list = (data || []) as AuditRow[];
    const ids = Array.from(new Set(list.map((r) => r.actor_id).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id,display_name").in("user_id", ids);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p.display_name]));
      list.forEach((r) => (r.actor_name = r.actor_id ? map.get(r.actor_id) ?? null : null));
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" /> Journal d'audit admin
          </h2>
          <p className="text-xs text-muted-foreground">
            Trace les modifications de règles et les décisions manuelles. 100 dernières entrées.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "settings", "decisions"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? "Tout" : f === "settings" ? "Réglages" : "Décisions"}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={load} aria-label="Rafraîchir">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-6">Aucune entrée pour ce filtre.</div>
      ) : (
        <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {rows.map((r) => {
            const isSettings = r.entity_type === "gam_verification_settings";
            const isValidated = r.action === "manual_decision_validated";
            const isRejected = r.action === "manual_decision_rejected";
            const changes = isSettings ? diffSettings(r.before_data, r.after_data) : [];
            return (
              <li key={r.id} className="rounded-lg border border-border bg-background/40 p-3 text-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {isSettings && <SettingsIcon className="w-3.5 h-3.5 text-primary" />}
                    {isValidated && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    {isRejected && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                    <Badge variant="secondary" className="text-[10px]">
                      {ACTION_LABEL[r.action] ?? r.action}
                    </Badge>
                    <span className="text-muted-foreground">
                      par <span className="text-foreground">{r.actor_name || r.actor_id?.slice(0, 8) || "système"}</span>
                    </span>
                  </div>
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                </div>

                {isSettings && changes.length > 0 && (
                  <ul className="mt-2 ml-5 list-disc text-muted-foreground">
                    {changes.map((c, i) => <li key={i} className="font-mono text-[11px]">{c}</li>)}
                  </ul>
                )}

                {(isValidated || isRejected) && (
                  <div className="mt-2 text-muted-foreground space-y-0.5">
                    <div>Réclamation : <span className="font-mono text-foreground">{r.entity_id?.slice(0, 8)}</span></div>
                    {r.after_data?.review_reason && (
                      <div>Motif : <span className="text-foreground">{r.after_data.review_reason}</span></div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
