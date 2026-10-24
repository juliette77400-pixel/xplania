// Admin: human review of the official summaries shown in the Visa guide.
// Each summary links to the official pages it comes from; once re-read, the
// reviewer marks it "reviewed". A new summary (pages changed) resets the review.
import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ExternalLink, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { getCountryName } from "@/lib/countries";
import { formatDay, formatDayTime } from "@/lib/format-date";
import type { OfficialContent, OfficialSource } from "@/hooks/useOfficialInfo";

interface Row {
  id: string;
  country_code: string;
  locale: string;
  content: OfficialContent;
  source_dates: { sources?: OfficialSource[] };
  fetched_at: string;
  reviewed_at: string | null;
  review_note: string | null;
}

export default function AdminSources() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const q = useQuery({
    queryKey: ["admin-official-sources"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("official_info_cache")
        .select("id, country_code, locale, content, source_dates, fetched_at, reviewed_at, review_note")
        .order("reviewed_at", { ascending: true, nullsFirst: true })
        .order("fetched_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Row[];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, reviewed }: { id: string; reviewed: boolean }) => {
      const { error } = await supabase.from("official_info_cache").update(
        reviewed
          ? { reviewed_at: new Date().toISOString(), reviewed_by: user!.id, review_note: (notes[id] || "").trim().slice(0, 1000) || null }
          : { reviewed_at: null, reviewed_by: null, review_note: null },
      ).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => { toast.success(v.reviewed ? t("adminSources.saved") : t("adminSources.cleared")); void qc.invalidateQueries({ queryKey: ["admin-official-sources"] }); },
    onError: () => toast.error(t("adminSources.error")),
  });

  if (authLoading || adminLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth?next=/admin/sources" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background"><AppNavbar />
        <main id="main-content" className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h1 className="mb-2 text-2xl font-bold">{t("adminStats.restrictedTitle")}</h1>
          <p className="text-muted-foreground">{t("adminStats.restrictedDesc")}</p>
        </main>
      </div>
    );
  }

  const rows = q.data || [];
  const todo = rows.filter((r) => !r.reviewed_at).length;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-4xl space-y-6 px-4 py-10">
        <div>
          <Link to="/admin/stats" className="text-sm text-primary underline">{t("adminSources.back")}</Link>
          <h1 className="mt-2 text-2xl font-bold">{t("adminSources.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("adminSources.desc")}</p>
          <p className="mt-2 text-sm font-semibold">{t("adminSources.todo", { count: todo, total: rows.length })}</p>
        </div>

        <ol className="list-decimal space-y-1 rounded-xl border border-border/60 bg-card/40 p-4 pl-8 text-sm text-muted-foreground">
          {(t("adminSources.steps", { returnObjects: true }) as string[]).map((s, i) => <li key={i}>{s}</li>)}
        </ol>

        {q.isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        {q.isError && <p role="alert" className="text-sm text-destructive">{t("adminSources.error")}</p>}

        <ul className="space-y-3">
          {rows.map((r) => {
            const sources = r.source_dates?.sources || [];
            const c = r.content;
            const isOpen = open === r.id;
            return (
              <li key={r.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{getCountryName(r.country_code)} · {r.locale.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{t("adminSources.fetched", { date: formatDayTime(r.fetched_at, i18n.language) })}</p>
                  </div>
                  {r.reviewed_at
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success"><BadgeCheck className="h-3.5 w-3.5" />{t("adminSources.reviewedOn", { date: formatDay(r.reviewed_at, i18n.language) })}</span>
                    : <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-bold text-warning">{t("adminSources.toReview")}</span>}
                </div>
                <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                  {sources.map((s) => (
                    <li key={s.key}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 hover:underline ${s.ok ? "border-border" : "border-destructive/40 text-destructive"}`}>
                        {s.label}{s.updatedAt ? ` · ${formatDay(s.updatedAt, i18n.language)}` : ""}<ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen(isOpen ? null : r.id)}>{isOpen ? t("adminSources.hide") : t("adminSources.show")}</Button>
                {isOpen && c && (
                  <div className="mt-2 space-y-3 text-sm">
                    <Block title={t("visa2.cards.safety")} items={[c.safety?.published_label, c.safety?.summary, ...(c.safety?.zones || []).map((z) => `${z.name} — ${t(`visa2.safety.${z.category}`)}`), ...(c.safety?.key_points || [])]} />
                    <Block title={t("adminSources.entry")} items={[c.entry?.short_stay, c.entry?.long_stay, ...(c.entry?.documents || []), ...(c.entry?.other || [])]} />
                    <Block title={t("visa2.cards.health")} items={[...(c.health?.entry_requirements || []).map((x) => `${t("visa2.health.entry")} : ${x.item} — ${x.detail}`), ...(c.health?.routine || []).map((x) => x.item), ...(c.health?.stay || []).map((x) => `${x.item} — ${x.detail}`), ...(c.health?.conditional || []).map((x) => `${x.item} — ${x.condition}`), c.health?.malaria]} />
                    <Block title={t("visa2.emergency.title")} items={[...(c.emergency || []).map((e) => `${e.label} : ${e.number}`), [c.consulate?.name, c.consulate?.address, c.consulate?.phone].filter(Boolean).join(" · ")]} />
                    <Textarea maxLength={1000} rows={2} placeholder={t("adminSources.notePlaceholder")} value={notes[r.id] ?? r.review_note ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => review.mutate({ id: r.id, reviewed: true })} disabled={review.isPending}><BadgeCheck className="mr-1 h-3.5 w-3.5" />{t("adminSources.markReviewed")}</Button>
                      {r.reviewed_at && <Button size="sm" variant="outline" onClick={() => review.mutate({ id: r.id, reviewed: false })} disabled={review.isPending}>{t("adminSources.unmark")}</Button>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

function Block({ title, items }: { title: string; items: Array<string | null | undefined> }) {
  const list = items.filter((x): x is string => !!x && !!x.trim());
  if (!list.length) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="list-disc space-y-0.5 pl-5">{list.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}
