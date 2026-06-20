import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CloudRain,
  ShieldAlert,
  CalendarDays,
  Activity as ActivityIcon,
  Bus,
  Bell,
  ExternalLink,
  Check,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import AlertSubscriptionDialog from "./AlertSubscriptionDialog";

interface TripAlert {
  id: string;
  category: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  source: string | null;
  source_url: string | null;
  link: string | null;
  read_at: string | null;
  dismissed: boolean;
  created_at: string;
}

interface Props {
  tripId: string;
  destination?: string;
  lat?: number;
  lng?: number;
}

const CATEGORY_ICON: Record<string, typeof CloudRain> = {
  weather: CloudRain,
  climate: CloudRain,
  security: ShieldAlert,
  events: CalendarDays,
  activities: ActivityIcon,
  transport: Bus,
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-sky-500/10 border-sky-500/30 text-sky-500",
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-500",
  critical: "bg-red-500/10 border-red-500/30 text-red-500",
};

const AlertsPanel = ({ tripId, destination, lat, lng }: Props) => {
  const { t, i18n } = useTranslation();
  const [alerts, setAlerts] = useState<TripAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [adaptations, setAdaptations] = useState<
    Array<{ title: string; reason: string; action: string }>
  >([]);

  const locale = i18n.language?.startsWith("en") ? "en" : "fr";

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("trip_alerts")
      .select("*")
      .eq("trip_id", tripId)
      .eq("dismissed", false)
      .order("created_at", { ascending: false });
    setAlerts((data || []) as TripAlert[]);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`trip-alerts-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_alerts", filter: `trip_id=eq.${tripId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [tripId, load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke("fetch-trip-alerts", {
        body: { tripId, destination, lat, lng, locale },
      });
      if (error) throw error;
      toast.success(t("suiviAlerts.refreshed"));
      load();
    } catch (e) {
      toast.error(t("suiviAlerts.refreshError"));
    } finally {
      setRefreshing(false);
    }
  };

  const dismiss = async (id: string) => {
    await supabase.from("trip_alerts").update({ dismissed: true }).eq("id", id);
  };

  const markRead = async (id: string) => {
    await supabase.from("trip_alerts").update({ read_at: new Date().toISOString() }).eq("id", id);
  };

  const adaptItinerary = async () => {
    setAdapting(true);
    try {
      const { data, error } = await supabase.functions.invoke("adapt-itinerary", {
        body: { tripId, destination, locale },
      });
      if (error) throw error;
      setAdaptations(data?.adaptations || []);
      if (!data?.adaptations?.length) toast.info(t("suiviAlerts.noAdaptation"));
    } catch (e) {
      toast.error(t("suiviAlerts.adaptError"));
    } finally {
      setAdapting(false);
    }
  };

  const hasActionable = alerts.some((a) => a.severity !== "info");
  const unreadCount = alerts.filter((a) => !a.read_at).length;

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">{t("suiviAlerts.title")}</h3>
          {unreadCount > 0 && (
            <Badge variant="default" className="h-5 text-[10px] px-1.5">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setSubOpen(true)} className="h-8 text-xs">
            <Bell className="w-3.5 h-3.5 mr-1.5" />
            {t("suiviAlerts.subscribe")}
          </Button>
          <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing} className="h-8 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            {t("suiviAlerts.refresh")}
          </Button>
        </div>
      </div>

      {loading && alerts.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
      )}

      {!loading && alerts.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">{t("suiviAlerts.empty")}</p>
      )}

      <div className="space-y-2">
        {alerts.map((a) => {
          const Icon = CATEGORY_ICON[a.category] || AlertTriangle;
          return (
            <div
              key={a.id}
              className={`rounded-xl border p-3 ${SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.info}`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{a.title}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
                      {t(`suiviAlerts.category.${a.category}`, a.category)}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground/80 mt-1">{a.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px]">
                    {a.link && (
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {a.source || t("suiviAlerts.officialSource")}
                      </a>
                    )}
                    {!a.read_at && (
                      <button
                        onClick={() => markRead(a.id)}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        {t("suiviAlerts.markRead")}
                      </button>
                    )}
                    <button
                      onClick={() => dismiss(a.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {t("suiviAlerts.dismiss")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasActionable && (
        <div className="pt-2 border-t border-border/60">
          <Button
            size="sm"
            variant="default"
            onClick={adaptItinerary}
            disabled={adapting}
            className="w-full sm:w-auto"
          >
            <Sparkles className={`w-4 h-4 mr-1.5 ${adapting ? "animate-pulse" : ""}`} />
            {adapting ? t("suiviAlerts.adapting") : t("suiviAlerts.adaptCta")}
          </Button>
          {adaptations.length > 0 && (
            <ul className="mt-3 space-y-2">
              {adaptations.map((ad, i) => (
                <li key={i} className="rounded-lg bg-muted/40 border border-border p-3 text-xs">
                  <p className="font-semibold text-sm">{ad.title}</p>
                  <p className="text-muted-foreground mt-1">{ad.reason}</p>
                  <p className="mt-1.5">
                    <span className="font-medium">{t("suiviAlerts.action")} :</span> {ad.action}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <AlertSubscriptionDialog open={subOpen} onOpenChange={setSubOpen} tripId={tripId} />
    </div>
  );
};

export default AlertsPanel;
