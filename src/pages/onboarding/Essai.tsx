import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2, Sparkles, Lock, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTravelerProfile } from "@/hooks/useTravelerProfile";
import {
  setLocalOnboarding,
  clearLocalOnboarding,
  trackOnboardingEvent,
} from "@/lib/onboarding-state";
import type { FeatureKey, TravelerBadgeKey } from "@/lib/traveler-badge";
import { Button } from "@/components/ui/button";

const FEATURE_ROUTE: Record<FeatureKey, string> = {
  discover: "/discover",
  carnet: "/carnets",
  suivi: "/suivi",
  mood: "/mood",
  "guide-valise": "/guide-valise",
  "guide-budget": "/guide-budget",
  "guide-visa": "/guide-visa",
};

interface PreviewItem {
  title: string;
  subtitle?: string;
  meta?: string;
}

// Curated fallback content per feature × badge, used when no DB rows exist.
// Flavor text is looked up via i18n key ui2.Essai.badgeFlavor.<badge> at render time.

type TFunc = (key: string, opts?: Record<string, unknown>) => string;

const badgeFlavor = (t: TFunc, b: TravelerBadgeKey) => t(`ui2.Essai.badgeFlavor.${b}`);

const buildStaticPreviews = (t: TFunc, f: FeatureKey, b: TravelerBadgeKey): PreviewItem[] => {
  const flavor = badgeFlavor(t, b);
  const p = (key: string) => t(`ui2.Essai.previews.${f}.${key}`, { flavor });
  switch (f) {
    case "discover":
      return [
        { title: p("0.title"), subtitle: p("0.subtitle"), meta: p("0.meta") },
        { title: p("1.title"), subtitle: p("1.subtitle"), meta: p("1.meta") },
        { title: p("2.title"), subtitle: p("2.subtitle"), meta: p("2.meta") },
      ];
    case "mood":
      return [
        { title: p("0.title"), subtitle: p("0.subtitle") },
        { title: p("1.title"), subtitle: p("1.subtitle") },
        { title: p("2.title"), subtitle: p("2.subtitle") },
      ];
    case "carnet":
      return [
        { title: p("0.title"), subtitle: p("0.subtitle") },
        { title: p("1.title"), subtitle: p("1.subtitle") },
        { title: p("2.title"), subtitle: p("2.subtitle") },
      ];
    case "suivi":
      return [
        { title: p("0.title"), subtitle: p("0.subtitle") },
        { title: p("1.title"), subtitle: p("1.subtitle") },
        { title: p("2.title"), subtitle: p("2.subtitle") },
      ];
    case "guide-valise":
      return [
        { title: p("0.title"), subtitle: p("0.subtitle") },
        { title: p("1.title"), subtitle: p("1.subtitle") },
        { title: p("2.title"), subtitle: p("2.subtitle") },
      ];
    case "guide-budget":
      return [
        { title: p("0.title"), subtitle: p("0.subtitle"), meta: p("0.meta") },
        { title: p("1.title"), subtitle: p("1.subtitle") },
        { title: p("2.title"), subtitle: p("2.subtitle") },
      ];
    case "guide-visa":
      return [
        { title: p("0.title"), subtitle: p("0.subtitle") },
        { title: p("1.title"), subtitle: p("1.subtitle") },
        { title: p("2.title"), subtitle: p("2.subtitle") },
      ];
    default:
      return [];
  }
};

const OnboardingEssai = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading } = useTravelerProfile();
  const [params] = useSearchParams();
  const f = (params.get("f") as FeatureKey) || "discover";
  const [items, setItems] = useState<PreviewItem[] | null>(null);
  const [source, setSource] = useState<"db" | "curated">("curated");

  useEffect(() => {
    setLocalOnboarding({ step: "essai" });
    trackOnboardingEvent("step_view", { step: "essai", feature: f });
  }, [f]);

  const badge = (profile?.badge ?? "curious") as TravelerBadgeKey;

  // Fetch real content per feature when possible; fallback to curated list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setItems(null);
      let dbItems: PreviewItem[] | null = null;
      try {
        if (f === "discover") {
          const { data } = await supabase
            .from("places")
            .select("name, category, rating_avg, rating_count, why_fits, hidden_gem")
            .order("rating_avg", { ascending: false })
            .limit(3);
          if (data && data.length > 0) {
            dbItems = data.map((p) => ({
              title: p.name,
              subtitle: p.why_fits ?? p.category,
              meta:
                p.rating_count > 0
                  ? `${p.rating_count} avis · ${Number(p.rating_avg).toFixed(1)}★`
                  : p.hidden_gem
                  ? "hidden gem"
                  : undefined,
            }));
          }
        } else if (f === "mood" && user) {
          const { data } = await supabase
            .from("mood_places")
            .select("name, mood, why_fits, tips")
            .eq("user_id", user.id)
            .order("score", { ascending: false })
            .limit(3);
          if (data && data.length > 0) {
            dbItems = data.map((p) => ({
              title: p.name,
              subtitle: p.why_fits ?? p.mood,
              meta: p.tips ?? undefined,
            }));
          }
        } else if (f === "carnet" && user) {
          const { data } = await supabase
            .from("journals")
            .select("title, tone, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3);
          if (data && data.length > 0) {
            dbItems = data.map((j) => ({
              title: j.title ?? "Carnet",
              subtitle: j.tone ?? undefined,
              meta: new Date(j.created_at).toLocaleDateString(i18n.language),
            }));
          }
        }
      } catch (e) {
        console.warn("[essai] preview fetch failed", e);
      }
      if (cancelled) return;
      if (dbItems && dbItems.length > 0) {
        setItems(dbItems);
        setSource("db");
      } else {
        setItems(buildStaticPreviews(t, f, badge));
        setSource("curated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [f, user, badge, i18n.language]);

  const heading = useMemo(
    () => t(`travelerProfile.features.${f}.name`),
    [f, t],
  );

  const finish = async () => {
    trackOnboardingEvent("essai_tried", { feature: f, source });
    if (user) {
      await supabase
        .from("traveler_profiles")
        .update({ onboarding_step: "done" })
        .eq("user_id", user.id);
    }
    clearLocalOnboarding();
    window.location.href = "/app";
  };

  const openFull = () => {
    trackOnboardingEvent("essai_open_full", { feature: f });
    void finish();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.completed_at) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="gradient-button mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t("onboarding.essai.tag", "Aperçu")}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{heading}</h1>
          <p className="mt-3 text-muted-foreground">
            {source === "db"
              ? t("onboarding.essai.helpReal", "Voici du contenu réel adapté à votre profil.")
              : t("onboarding.essai.help", "Un avant-goût de ce que Xplania fera pour vous.")}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6">
          {items === null ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((it, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    {source === "db" ? (
                      <MapPin className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{it.title}</div>
                    {it.subtitle && (
                      <div className="text-xs text-muted-foreground">{it.subtitle}</div>
                    )}
                    {it.meta && (
                      <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <Star className="h-3 w-3" /> {it.meta}
                      </div>
                    )}
                  </div>
                </li>
              ))}
              <li className="flex items-start gap-3 opacity-60">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <p className="text-sm">
                  {t("onboarding.essai.locked", "Débloquez la version complète dans votre dashboard.")}
                </p>
              </li>
            </ul>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={finish} className="gradient-button" size="lg">
            {t("onboarding.essai.unlock", "Débloquer tout")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link
            to={FEATURE_ROUTE[f] ?? "/app"}
            onClick={openFull}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {t("onboarding.essai.openFeature", "Ouvrir la fonctionnalité complète")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OnboardingEssai;
