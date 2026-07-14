import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, RefreshCw, ScrollText, Settings as SettingsIcon, CheckCircle2, XCircle,
  Download, FileText, Filter,
} from "lucide-react";
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
  update_notif_settings: "Modif. notifications",
  manual_decision_validated: "Validation manuelle",
  manual_decision_rejected: "Rejet manuel",
};

function diffJson(before: any, after: any): string[] {
  if (!before || !after) return [];
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  const out: string[] = [];
  for (const k of keys) {
    if (k === "updated_at") continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      out.push(`${k}: ${JSON.stringify(before[k])} → ${JSON.stringify(after[k])}`);
    }
  }
  return out;
}

function csvEscape(v: any): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AdminAuditPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [actorId, setActorId] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("gam_admin_audit").select("*").order("created_at", { ascending: false }).limit(500);
    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) {
      const t = new Date(to); t.setHours(23, 59, 59, 999);
      q = q.lte("created_at", t.toISOString());
    }
    if (actorId !== "all") q = q.eq("actor_id", actorId);
    if (actionFilter !== "all") {
      if (actionFilter === "settings") q = q.in("entity_type", ["gam_verification_settings", "gam_notification_settings"]);
      else if (actionFilter === "decisions") q = q.eq("entity_type", "gam_badge_claim");
      else q = q.eq("action", actionFilter);
    }
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
      list.forEach((r) => (r.actor_name = r.actor_id ? (map.get(r.actor_id) ?? null) : null));
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, actorId, actionFilter]);

  const actors = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((r) => { if (r.actor_id) seen.set(r.actor_id, r.actor_name || r.actor_id.slice(0, 8)); });
    return Array.from(seen.entries());
  }, [rows]);

  const stamp = () => new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");

  const exportCsv = () => {
    const headers = ["created_at", "actor", "action", "entity_type", "entity_id", "review_reason", "changes"];
    const lines = [headers.join(",")];
    for (const r of rows) {
      const changes = r.entity_type.endsWith("_settings") ? diffJson(r.before_data, r.after_data).join(" | ") : "";
      const reason = r.after_data?.review_reason || "";
      lines.push([
        r.created_at,
        r.actor_name || r.actor_id || "",
        ACTION_LABEL[r.action] ?? r.action,
        r.entity_type,
        r.entity_id || "",
        reason,
        changes,
      ].map(csvEscape).join(","));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-admin-${stamp()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exporté");
  };

  const exportPdf = () => {
    const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 36;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Journal d'audit admin", margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const filterLine = [
      from ? `du ${from}` : "depuis le début",
      to ? `au ${to}` : "jusqu'à aujourd'hui",
      actorId !== "all" ? `admin: ${actors.find(([id]) => id === actorId)?.[1] || actorId}` : "tous admins",
      `type: ${actionFilter}`,
      `${rows.length} entrées`,
    ].join(" · ");
    doc.text(filterLine, margin, y);
    y += 16;

    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    y += 12;

    const ensureSpace = (h: number) => {
      if (y + h > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    for (const r of rows) {
      const date = new Date(r.created_at).toLocaleString();
      const actor = r.actor_name || r.actor_id?.slice(0, 8) || "système";
      const label = ACTION_LABEL[r.action] ?? r.action;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      ensureSpace(28);
      doc.text(`${label}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110);
      doc.text(`${date}  ·  par ${actor}`, margin, y + 12);
      doc.setTextColor(0);
      y += 24;

      const details: string[] = [];
      if (r.entity_type.endsWith("_settings")) {
        details.push(...diffJson(r.before_data, r.after_data));
      } else if (r.entity_type === "gam_badge_claim") {
        details.push(`Réclamation: ${r.entity_id?.slice(0, 8) ?? "?"}`);
        if (r.after_data?.review_reason) details.push(`Motif: ${r.after_data.review_reason}`);
      }
      doc.setFontSize(9);
      for (const d of details) {
        const lines = doc.splitTextToSize(`• ${d}`, pageW - margin * 2 - 12);
        for (const ln of lines) {
          ensureSpace(12);
          doc.text(ln, margin + 12, y);
          y += 12;
        }
      }
      y += 6;
      ensureSpace(1);
      doc.setDrawColor(235);
      doc.line(margin, y, pageW - margin, y);
      y += 8;
    }

    doc.save(`audit-admin-${stamp()}.pdf`);
    toast.success("PDF exporté");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" /> Journal d'audit admin
          </h2>
          <p className="text-xs text-muted-foreground">
            Trace les modifications de règles et les décisions manuelles. 500 dernières entrées filtrables.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={exportPdf} disabled={rows.length === 0}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={load} aria-label="Rafraîchir">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl border border-border bg-background/40 p-3">
        <div>
          <Label className="text-[11px] flex items-center gap-1"><Filter className="w-3 h-3" /> Du</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[11px]">Au</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[11px]">Admin</Label>
          <Select value={actorId} onValueChange={setActorId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {actors.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px]">Type</Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="settings">Réglages (toutes)</SelectItem>
              <SelectItem value="decisions">Décisions manuelles</SelectItem>
              <SelectItem value="manual_decision_validated">Validations</SelectItem>
              <SelectItem value="manual_decision_rejected">Rejets</SelectItem>
              <SelectItem value="update_settings">Règles vérification</SelectItem>
              <SelectItem value="update_notif_settings">Notifications</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-6">Aucune entrée pour ces filtres.</div>
      ) : (
        <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {rows.map((r) => {
            const isSettings = r.entity_type.endsWith("_settings");
            const isValidated = r.action === "manual_decision_validated";
            const isRejected = r.action === "manual_decision_rejected";
            const changes = isSettings ? diffJson(r.before_data, r.after_data) : [];
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
