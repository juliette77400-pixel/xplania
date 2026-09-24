import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save, Sliders, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useDestinationSuggestions } from "@/hooks/useDestinationSuggestions";

const DIMENSION_KEYS = [
  "culture",
  "adventure",
  "nature",
  "comfort",
  "budget",
  "food",
  "authenticity",
  "social",
  "wellbeing",
  "nomad",
  "luxury",
  "organization",
] as const;

type ScoreKey = typeof DIMENSION_KEYS[number];

export default function TravelerProfileAdjust() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const DIMENSIONS = DIMENSION_KEYS.map((key) => ({
    key,
    label: t(`ui2.TravelerProfileAdjust.dimensions.${key}.label`),
    hint: t(`ui2.TravelerProfileAdjust.dimensions.${key}.hint`),
  }));

  const [scores, setScores] = useState<Record<ScoreKey, number>>(() =>
    DIMENSION_KEYS.reduce((acc, d) => ({ ...acc, [d]: 50 }), {} as Record<ScoreKey, number>),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [badge, setBadge] = useState<string | null>(null);

  // Live preview of destinations with current scores (uses saved scores — invalidated after save)
  const { data: previewDestinations, refetch: refetchPreview, isFetching: previewFetching } =
    useDestinationSuggestions({ limit: 3, originalityBoost: 0.4 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("traveler_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setScores(
          DIMENSION_KEYS.reduce((acc, d) => {
            const raw = (data as any)[`${d}_score`] ?? 0;
            return { ...acc, [d]: Math.max(0, Math.min(100, raw)) };
          }, {} as Record<ScoreKey, number>),
        );
        setBadge(data.badge ?? null);
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const patch = DIMENSION_KEYS.reduce((acc, d) => ({ ...acc, [`${d}_score`]: scores[d] }), {} as Record<string, number>);
      const { error } = await supabase
        .from("traveler_profiles")
        .update(patch as never)
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success(t("ui2.TravelerProfileAdjust.toastUpdated"));
      qc.invalidateQueries({ queryKey: ["xplania-destinations"] });
      refetchPreview();
    } catch (e: any) {
      toast.error(e?.message || t("ui2.TravelerProfileAdjust.toastSaveError"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sliders className="h-7 w-7 text-primary" /> {t("ui2.TravelerProfileAdjust.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("ui2.TravelerProfileAdjust.subtitle")}
          </p>
          {badge && (
            <p className="mt-2 text-sm">
              {t("ui2.TravelerProfileAdjust.badgeCurrent")} <span className="font-semibold text-primary">{badge}</span>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("ui2.TravelerProfileAdjust.dimensionsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {DIMENSIONS.map((d) => (
                <div key={d.key}>
                  <div className="flex justify-between items-baseline mb-1">
                    <div>
                      <span className="font-medium">{d.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{d.hint}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-primary">{scores[d.key]}</span>
                  </div>
                  <Slider
                    value={[scores[d.key]]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => setScores((s) => ({ ...s, [d.key]: v[0] }))}
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => navigate("/profil-voyageur")}>
                  {t("ui2.TravelerProfileAdjust.redoTinder")}
                </Button>
                <Button onClick={save} disabled={saving} className="flex-1">
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("ui2.TravelerProfileAdjust.saving")}</> : <><Save className="mr-2 h-4 w-4" />{t("ui2.TravelerProfileAdjust.saveBtn")}</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit sticky top-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> {t("ui2.TravelerProfileAdjust.previewTitle")}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => refetchPreview()} disabled={previewFetching}>
                {previewFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("ui2.TravelerProfileAdjust.previewHint")}
              </p>
              {(previewDestinations ?? []).map((d) => (
                <div key={d.slug} className="rounded-lg border p-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-sm">{d.name}</span>
                    <span className="text-xs font-mono text-primary">{d.match_score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.country}</p>
                </div>
              ))}
              {previewDestinations?.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">{t("ui2.TravelerProfileAdjust.noDestination")}</p>
              )}
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/destinations")}>
                {t("ui2.TravelerProfileAdjust.viewAllDestinations")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
