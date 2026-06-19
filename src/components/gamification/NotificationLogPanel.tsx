import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Mail, RefreshCw } from "lucide-react";

type LogRow = {
  id: string;
  user_id: string;
  claim_id: string | null;
  badge_id: string | null;
  transition: string;
  channel: string;
  status: string;
  error: string | null;
  payload: any;
  created_at: string;
};

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "sent") return "default";
  if (s === "queued") return "secondary";
  if (s === "skipped") return "outline";
  return "destructive";
};

export default function NotificationLogPanel() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<"all" | "in_app" | "email">("all");
  const [status, setStatus] = useState<"all" | "sent" | "skipped" | "queued" | "error">("all");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("gam_notification_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (channel !== "all") q = q.eq("channel", channel);
    if (status !== "all") q = q.eq("status", status);
    const { data } = await q;
    setRows((data || []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, status]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Historique des notifications
          </h2>
          <p className="text-xs text-muted-foreground">
            Trace de chaque notification envoyée (in-app / email) lors d'une transition de réclamation.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Rafraîchir
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {(["all", "in_app", "email"] as const).map((c) => (
            <Button key={c} size="sm" variant={channel === c ? "default" : "outline"} onClick={() => setChannel(c)}>
              {c === "all" ? "Tous canaux" : c === "in_app" ? "In-app" : "Email"}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["all", "sent", "skipped", "queued", "error"] as const).map((s) => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
              {s === "all" ? "Tous statuts" : s}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Aucune notification enregistrée.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Canal</th>
                <th className="py-2 pr-3">Transition</th>
                <th className="py-2 pr-3">Statut</th>
                <th className="py-2 pr-3">Utilisateur</th>
                <th className="py-2 pr-3">Détails</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/40 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center gap-1">
                      {r.channel === "email" ? <Mail className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                      {r.channel}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-mono">{r.transition}</td>
                  <td className="py-2 pr-3"><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                  <td className="py-2 pr-3 font-mono">{r.user_id.slice(0, 8)}</td>
                  <td className="py-2 pr-3 text-muted-foreground max-w-[260px] truncate">
                    {r.error
                      ? <span className="text-destructive">{r.error}</span>
                      : r.payload?.title || r.payload?.reason || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
