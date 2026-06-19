import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Mail, RefreshCw } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type LogRow = Database["public"]["Tables"]["gam_notification_log"]["Row"];

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "sent") return "default";
  if (s === "queued") return "secondary";
  if (s === "skipped") return "outline";
  return "destructive";
};

export default function UserNotificationHistory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<"all" | "in_app" | "email">("all");
  const [status, setStatus] = useState<"all" | "sent" | "skipped" | "queued" | "error">("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("gam_notification_log")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (channel !== "all") q = q.eq("channel", channel);
    if (status !== "all") q = q.eq("status", status);
    const { data } = await q;
    setRows((data || []) as LogRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, channel, status]);

  return (
    <section>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("gam.notifications.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("gam.notifications.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <div className="flex gap-1">
          {(["all", "in_app", "email"] as const).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={channel === c ? "default" : "outline"}
              onClick={() => setChannel(c)}
            >
              {t(`gam.notifications.channel.${c}`)}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["all", "sent", "skipped", "queued", "error"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "default" : "outline"}
              onClick={() => setStatus(s)}
            >
              {t(`gam.notifications.status.${s}`)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="w-5 h-5 animate-spin inline text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("gam.notifications.empty")}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground bg-muted/30">
                <tr className="border-b border-border">
                  <th className="py-3 px-4">{t("gam.notifications.date")}</th>
                  <th className="py-3 px-4">{t("gam.notifications.channel")}</th>
                  <th className="py-3 px-4">{t("gam.notifications.transition")}</th>
                  <th className="py-3 px-4">{t("gam.notifications.status")}</th>
                  <th className="py-3 px-4">{t("gam.notifications.details")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 align-top">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        {r.channel === "email" ? <Mail className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                        {t(`gam.notifications.channel.${r.channel}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{r.transition}</td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant(r.status)}>{t(`gam.notifications.status.${r.status}`)}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                      {r.error ? (
                        <span className="text-destructive">{r.error}</span>
                      ) : (
                        r.payload && typeof r.payload === "object" && "title" in r.payload
                          ? String(r.payload.title)
                          : r.payload && typeof r.payload === "object" && "reason" in r.payload
                            ? String(r.payload.reason)
                            : "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
