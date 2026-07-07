import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, XCircle, Clock, MapPin, Image as ImageIcon, Sparkles } from "lucide-react";
import { explainClaim, statusLabel, type ClaimAnalysis } from "@/lib/claim-explain";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  badge_id: string;
  status: "in_progress" | "submitted" | "validated" | "rejected";
  proof_type: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_reason: string | null;
  ai_analysis: ClaimAnalysis;
  created_at: string;
  gam_badges?: { name_fr: string; name_en: string; points: number };
};

export default function ClaimHistoryPanel() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = (i18n.language?.startsWith("en") ? "en" : "fr") as "fr" | "en";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "submitted" | "validated" | "rejected">("all");

  useEffect(() => {
    if (!user) return;
    const q = supabase
      .from("gam_badge_claims")
      .select("*, gam_badges(name_fr,name_en,points)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    q.then(({ data, error }) => {
      if (error) console.warn(error);
      setRows((data || []) as any);
      setLoading(false);
    });
  }, [user]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  if (loading) {
    return (
      <section>
        <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-primary" /></div>
      </section>
    );
  }

  return (
    <section>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {lang === "fr" ? "Historique de mes réclamations" : "My claim history"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {lang === "fr"
            ? "Verdicts, raisons et statut de modération de tes badges."
            : "Verdicts, reasons and moderation status of your badges."}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap justify-center mb-4">
        {(["all", "submitted", "validated", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? (lang === "fr" ? "Tous" : "All")
              : f === "submitted" ? (lang === "fr" ? "En attente" : "Pending")
              : f === "validated" ? (lang === "fr" ? "Validés" : "Validated")
              : (lang === "fr" ? "Rejetés" : "Rejected")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {lang === "fr" ? "Aucune réclamation pour ce filtre." : "No claims for this filter."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const s = statusLabel(c.status, lang);
            const steps = explainClaim(c.ai_analysis, lang);
            const badgeName = lang === "en" ? c.gam_badges?.name_en : c.gam_badges?.name_fr;
            const toneClass =
              s.tone === "ok" ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-500"
              : s.tone === "bad" ? "border-red-500/40 bg-red-500/5 text-red-500"
              : s.tone === "wait" ? "border-amber-500/40 bg-amber-500/5 text-amber-500"
              : "border-border bg-card text-muted-foreground";
            const auto = c.reviewed_at && c.reviewed_by == null;
            return (
              <details key={c.id} className="rounded-2xl border border-border bg-card overflow-hidden group">
                <summary className="flex items-center gap-3 p-4 cursor-pointer list-none">
                  <div className={cn("w-9 h-9 rounded-full border flex items-center justify-center shrink-0", toneClass)}>
                    {s.tone === "ok" ? <CheckCircle2 className="w-4 h-4" />
                      : s.tone === "bad" ? <XCircle className="w-4 h-4" />
                      : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{badgeName || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.label}
                      {c.submitted_at && <> · {new Date(c.submitted_at).toLocaleString()}</>}
                      {auto && <> · {lang === "fr" ? "auto" : "auto"}</>}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{c.gam_badges?.points ?? 0} pts</span>
                </summary>

                <div className="px-4 pb-4 space-y-2 text-xs">
                  {steps.length === 0 ? (
                    <p className="text-muted-foreground italic">
                      {lang === "fr" ? "Aucune analyse automatique disponible." : "No automatic analysis available."}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {steps.map((st, i) => (
                        <li key={i} className="flex items-start gap-2">
                          {st.kind === "geo" && <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />}
                          {st.kind === "exif" && <ImageIcon className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />}
                          {st.kind === "ai" && <Sparkles className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />}
                          <span>
                            <span className="font-medium text-foreground">{st.label}</span>
                            {st.detail && <span className="text-muted-foreground"> — {st.detail}</span>}
                            <span className={st.ok ? "text-emerald-500 ml-1" : "text-muted-foreground/70 ml-1"}>
                              {st.ok ? "✓" : "•"}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {c.review_reason && (
                    <p className="rounded-md border border-border bg-muted/30 px-2 py-1.5 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {lang === "fr" ? "Motif modération" : "Moderation note"} :
                      </span>{" "}
                      {c.review_reason}
                    </p>
                  )}

                  {c.reviewed_at && (
                    <p className="text-muted-foreground">
                      {lang === "fr" ? "Statut mis à jour le" : "Status updated on"}{" "}
                      {new Date(c.reviewed_at).toLocaleString()}{" "}
                      ({auto ? (lang === "fr" ? "automatique" : "automatic") : (lang === "fr" ? "modérateur" : "moderator")})
                    </p>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
