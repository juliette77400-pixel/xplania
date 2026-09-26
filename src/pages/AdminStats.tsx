import { lazy, Suspense, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

const AdminStatsChart = lazy(() => import("@/components/admin/AdminStatsChart"));

type EventRow = {
  session_id: string;
  event: string;
  path: string | null;
  props: any;
  referrer: string | null;
  utm_source: string | null;
  created_at: string;
};

const FUNNEL_STEPS = ["page_view", "quiz_started", "quiz_completed", "signup_started", "signup_completed", "trip_created"] as const;

export default function AdminStats() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<7 | 30>(7);

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - period);
    return d.toISOString();
  }, [period]);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-stats-events", since],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("session_id,event,path,props,referrer,utm_source,created_at")
        .gte("created_at", since)
        .limit(20000);
      if (error) throw error;
      return (data || []) as EventRow[];
    },
  });

  const stats = useMemo(() => {
    const list = rows ?? [];
    const uniqueSessions = new Set(list.map((r) => r.session_id));
    const pageViews = list.filter((r) => r.event === "page_view");
    const signups = new Set(list.filter((r) => r.event === "signup_completed").map((r) => r.session_id));
    const trips = new Set(list.filter((r) => r.event === "trip_created").map((r) => r.session_id));

    const dailyMap = new Map<string, Set<string>>();
    for (const r of list) {
      const day = r.created_at.slice(0, 10);
      if (!dailyMap.has(day)) dailyMap.set(day, new Set());
      dailyMap.get(day)!.add(r.session_id);
    }
    const daily = Array.from(dailyMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, set]) => ({ date, visitors: set.size }));

    const pageCounts = new Map<string, number>();
    for (const r of pageViews) {
      const key = r.path || "/";
      pageCounts.set(key, (pageCounts.get(key) ?? 0) + 1);
    }
    const topPages = Array.from(pageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const sourceCounts = new Map<string, Set<string>>();
    for (const r of list) {
      let source = "Direct";
      if (r.utm_source) source = r.utm_source;
      else if (r.referrer) {
        try {
          source = new URL(r.referrer).hostname.replace(/^www\./, "");
        } catch {
          source = "Direct";
        }
      }
      if (!sourceCounts.has(source)) sourceCounts.set(source, new Set());
      sourceCounts.get(source)!.add(r.session_id);
    }
    const sources = Array.from(sourceCounts.entries())
      .map(([source, set]) => [source, set.size] as const)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const funnel = FUNNEL_STEPS.map((step) => ({
      step,
      sessions: new Set(list.filter((r) => r.event === step).map((r) => r.session_id)).size,
    }));
    const firstCount = funnel[0]?.sessions || 0;
    const funnelWithRates = funnel.map((f, i) => ({
      ...f,
      pct: firstCount ? Math.round((f.sessions / firstCount) * 100) : 0,
      dropoff: i === 0 ? 0 : Math.max(0, (funnel[i - 1]?.sessions || 0) - f.sessions),
    }));

    return {
      uniqueVisitors: uniqueSessions.size,
      pageViewsCount: pageViews.length,
      signupsCount: signups.size,
      tripsCount: trips.size,
      daily,
      topPages,
      sources,
      funnel: funnelWithRates,
      isEmpty: list.length === 0,
    };
  }, [rows]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <main id="main-content" tabIndex={-1} className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t("adminStats.restrictedTitle")}</h1>
          <p className="text-muted-foreground">{t("adminStats.restrictedDesc")}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("adminStats.pageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("adminStats.pageDesc")}</p>
          </div>
          <div className="flex gap-2">
            {([7, 30] as const).map((p) => (
              <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)}>
                {t("adminStats.periodDays", { count: p })}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-primary" /></div>
        ) : stats.isEmpty ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            {t("adminStats.emptyState")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t("adminStats.kpiVisitors"), value: stats.uniqueVisitors },
                { label: t("adminStats.kpiPageViews"), value: stats.pageViewsCount },
                { label: t("adminStats.kpiSignups"), value: stats.signupsCount },
                { label: t("adminStats.kpiTrips"), value: stats.tripsCount },
              ].map((k) => (
                <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold text-foreground">{k.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3">{t("adminStats.chartTitle")}</h2>
              <Suspense fallback={<div className="h-[260px] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}>
                <AdminStatsChart data={stats.daily} />
              </Suspense>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold mb-3">{t("adminStats.topPagesTitle")}</h2>
                <ul className="space-y-1.5">
                  {stats.topPages.map(([path, count]) => (
                    <li key={path} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{path}</span>
                      <span className="font-semibold text-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold mb-3">{t("adminStats.sourcesTitle")}</h2>
                <ul className="space-y-1.5">
                  {stats.sources.map(([source, count]) => (
                    <li key={source} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{source}</span>
                      <span className="font-semibold text-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3">{t("adminStats.funnelTitle")}</h2>
              <ul className="space-y-2">
                {stats.funnel.map((f) => (
                  <li key={f.step} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                    <span className="text-foreground font-medium">{t(`adminStats.funnelStep.${f.step}`)}</span>
                    <span className="text-muted-foreground">
                      {f.sessions} · {f.pct}% {f.dropoff > 0 && <span className="text-destructive">(-{f.dropoff})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
