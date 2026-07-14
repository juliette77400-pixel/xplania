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
const BADGE_FLAVOR: Record<TravelerBadgeKey, string> = {
  cultural_explorer: "culture & authenticité",
  digital_nomad: "workation & mobilité",
  relaxation: "détente & confort",
  adventurer: "aventure & sensations",
  nature: "nature & paysages",
  gastronomic: "gastronomie & saveurs",
  wellbeing: "bien-être & lenteur",
  social: "rencontres & communauté",
  organized: "planification & sérénité",
  budget: "petit budget malin",
  curious: "découverte tous azimuts",
};

const STATIC_PREVIEWS: Record<FeatureKey, (badge: TravelerBadgeKey) => PreviewItem[]> = {
  discover: (b) => [
    { title: "Un café confidentiel repéré par la communauté", subtitle: `orienté ${BADGE_FLAVOR[b]}`, meta: "8 avis · 4.6★" },
    { title: "Une balade au coucher de soleil hors sentiers", subtitle: "moins de 30 min de marche", meta: "gratuit" },
    { title: "Un lieu insolite à moins d'1h", subtitle: "peu fréquenté en semaine", meta: "conseil de local" },
  ],
  mood: (b) => [
    { title: "Ambiance « slow morning »", subtitle: `mood suggéré pour un profil ${BADGE_FLAVOR[b]}` },
    { title: "Playlist urbaine feutrée", subtitle: "20 min pour vous poser" },
    { title: "3 spots calmes autour de vous", subtitle: "cartographiés en direct" },
  ],
  carnet: (b) => [
    { title: "Un carnet type prêt à remplir dès votre 1er voyage", subtitle: `template adapté au profil ${BADGE_FLAVOR[b]}` },
    { title: "Story auto-générée à chaque étape", subtitle: "récit IA à partir de vos photos" },
    { title: "Export PDF partageable", subtitle: "en un clic" },
  ],
  suivi: (b) => [
    { title: "Suivi live de votre position", subtitle: `pensé pour un profil ${BADGE_FLAVOR[b]}` },
    { title: "Alertes météo & sécurité en cours de route", subtitle: "notifications intelligentes" },
    { title: "Lien à partager à vos proches", subtitle: "carte publique éphémère" },
  ],
  "guide-valise": (b) => [
    { title: "Checklist adaptée à votre destination", subtitle: `optimisée pour un profil ${BADGE_FLAVOR[b]}` },
    { title: "3 essentiels souvent oubliés", subtitle: "selon la saison" },
    { title: "Astuces cabine / soute", subtitle: "conformes 2026" },
  ],
  "guide-budget": (b) => [
    { title: "Estimation flash de votre prochain voyage", subtitle: `calibré ${BADGE_FLAVOR[b]}`, meta: "3 postes clés" },
    { title: "Alertes dépassement en temps réel", subtitle: "par catégorie" },
    { title: "Comparateur coût de la vie", subtitle: "150 villes couvertes" },
  ],
  "guide-visa": (b) => [
    { title: "Formalités vérifiées en un clic", subtitle: `formatées pour un profil ${BADGE_FLAVOR[b]}` },
    { title: "Vaccins recommandés & obligatoires", subtitle: "sources OMS + gouvernementales" },
    { title: "Niveau de sécurité mis à jour", subtitle: "avis récents" },
  ],
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
            .select("title, destination_slug, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3);
          if (data && data.length > 0) {
            dbItems = data.map((j) => ({
              title: j.title ?? "Carnet",
              subtitle: j.destination_slug ?? undefined,
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
        setItems(STATIC_PREVIEWS[f](badge));
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
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
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
