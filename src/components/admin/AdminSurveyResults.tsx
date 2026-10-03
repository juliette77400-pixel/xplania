import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const AdminSurveyResults = () => {
  const { t } = useTranslation();
  const { data = [] } = useQuery({
    queryKey: ["admin-surveys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .select("nps, ease, favorite_feature, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const n = data.length;
  const promoters = data.filter((r) => r.nps >= 9).length;
  const detractors = data.filter((r) => r.nps <= 6).length;
  const nps = n ? Math.round(((promoters - detractors) / n) * 100) : 0;
  const ease = n ? (data.reduce((s, r) => s + r.ease, 0) / n).toFixed(1) : "–";
  const featureCounts = Object.entries(
    data.reduce<Record<string, number>>((acc, r) => {
      if (r.favorite_feature) acc[r.favorite_feature] = (acc[r.favorite_feature] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const comments = data.filter((r) => r.comment).slice(0, 8);

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">{t("survey.adminTitle")}</h2>
      {n === 0 ? (
        <p className="text-sm text-muted-foreground">{t("survey.adminEmpty")}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[[t("survey.adminCount"), n], [t("survey.adminNps"), nps], [t("survey.adminEase"), `${ease}/5`]].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          {featureCounts.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("survey.adminFeature")}</p>
              <div className="flex flex-wrap gap-2">
                {featureCounts.map(([f, c]) => (
                  <span key={f} className="rounded-lg border border-border px-2.5 py-1 text-xs">{t(`survey.features.${f}`)} · {c}</span>
                ))}
              </div>
            </div>
          )}
          {comments.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("survey.adminComments")}</p>
              <ul className="space-y-2">
                {comments.map((c, i) => (
                  <li key={i} className="rounded-lg bg-muted/40 p-3 text-sm">« {c.comment} »</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default AdminSurveyResults;
