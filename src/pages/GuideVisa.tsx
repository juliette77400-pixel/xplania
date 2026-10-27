// Visa guide: profile → four summary cards → personalised checklist →
// emergency contacts. Official pages (security, entry, health, contacts) are
// read for real; visa/passport answers for the exact profile come from the AI
// and are saved with the trip so nothing is regenerated on each visit.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, MessageCircle, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import QuotaBanner from "@/components/shared/QuotaBanner";
import UpgradeDialog from "@/components/shared/UpgradeDialog";
import RotatingStatusMessage from "@/components/shared/RotatingStatusMessage";
import VisaDisclaimer from "@/components/visa/VisaDisclaimer";
import VisaPipChat from "@/components/visa/VisaPipChat";
import VisaProfileCard from "@/components/visa/VisaProfileCard";
import VisaSummaryCards from "@/components/visa/VisaSummaryCards";
import VisaChecklist from "@/components/visa/VisaChecklist";
import VisaEmergency from "@/components/visa/VisaEmergency";
import { useTravelStore } from "@/stores/useTravelStore";
import { useActiveTrip } from "@/stores/useActiveTrip";
import { useHydrateActiveTrip } from "@/hooks/useHydrateActiveTrip";
import { useQuota } from "@/hooks/useQuota";
import { useAuth } from "@/hooks/useAuth";
import { useOfficialInfo } from "@/hooks/useOfficialInfo";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvokeError } from "@/lib/invoke-error";
import { saveModuleProgress } from "@/lib/prep-progress";
import { track } from "@/lib/analytics";
import { stayDurationDays } from "@/lib/prep-quiz";
import {
  carryChecked, countryLabel, hasFreeMovement, loadVisaState, missingVisaFields, normalizeAnalysis, saveVisaState,
  visaProfileFromTrip, visaProfileKey, visaStateKey, visaStayDays, type SavedVisaState, type VisaProfile,
} from "@/lib/visa-rules";
import type { TravelFormData } from "@/types/travel";
import GuestSaveBanner from "@/components/shared/GuestSaveBanner";

const GuideVisaPage = () => {
  useHydrateActiveTrip();
  const { t, i18n } = useTranslation();
  const lang: "fr" | "en" = i18n.language.startsWith("fr") ? "fr" : "en";
  const { user } = useAuth();
  const qc = useQueryClient();
  const tripData = useTravelStore((s) => s.tripData);
  const setTripData = useTravelStore((s) => s.setTripData);
  const tripId = useActiveTrip((s) => s.tripId);
  const { reached, consume } = useQuota("visa");

  const profile = useMemo(() => visaProfileFromTrip(tripData), [tripData]);
  const missing = missingVisaFields(profile);
  const days = visaStayDays(profile);
  const pKey = visaProfileKey(profile);
  const stateKey = visaStateKey(tripId, profile.destinationCode);
  const destinationName = countryLabel(profile.destinationCode);
  const nationalityName = countryLabel(profile.nationality);
  const isFrench = profile.nationality === "FR" || profile.secondNationality === "FR";

  const [saved, setSaved] = useState<SavedVisaState | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [chatOpenSignal, setChatOpenSignal] = useState(0);

  useEffect(() => { setSaved(profile.destinationCode ? loadVisaState(stateKey) : null); }, [stateKey, profile.destinationCode]);

  const official = useOfficialInfo(profile.destinationCode || undefined, lang);
  const analysis = saved?.analysis ?? null;
  const outdated = !!saved && saved.profileKey !== pKey;
  const checked = saved?.checked ?? {};

  // Dashboard progress for this destination.
  useEffect(() => {
    if (!analysis || !tripData?.destination) return;
    const done = analysis.checklist.filter((i) => checked[i.id]).length;
    saveModuleProgress("visa", tripData.destination, { done, total: analysis.checklist.length });
  }, [analysis, checked, tripData?.destination]);

  const saveProfile = useCallback(async (next: VisaProfile): Promise<boolean> => {
    if (!user || !tripId) { toast.error(t("visa2.profile.noTrip")); return false; }
    setSavingProfile(true);
    try {
      const { data: row, error: readErr } = await supabase.from("trips").select("form_data").eq("id", tripId).eq("user_id", user.id).maybeSingle();
      if (readErr) throw readErr;
      const old = ((row?.form_data as Record<string, unknown>) || {}) as Partial<TravelFormData>;
      const destination = countryLabel(next.destinationCode) || old.destination || "";
      const duration = stayDurationDays({ departureDate: next.departureDate, returnDate: next.returnDate, durationBucket: (next.durationBucket || "") as never });
      const form: Partial<TravelFormData> = {
        ...old,
        destination,
        arrivalCity: next.city.trim() || destination,
        nationality: next.nationality,
        secondNationality: next.secondNationality,
        residence: next.residence,
        departureLocation: countryLabel(next.residence) || old.departureLocation || "",
        stayType: next.stayType,
        departureDate: next.departureDate,
        returnDate: next.returnDate,
        durationBucket: next.departureDate && next.returnDate ? "" : next.durationBucket,
        duration,
        passportType: next.passportType,
        hasTransit: next.hasTransit,
        transitCountries: next.hasTransit === "yes" ? next.transitCountries : [],
        visitedRegions: next.regions.trim().slice(0, 200),
      };
      const { error: upErr } = await supabase.from("trips").update({
        destination,
        arrival_city: form.arrivalCity,
        departure_location: form.departureLocation || null,
        departure_date: next.departureDate || null,
        return_date: next.returnDate || null,
        duration: duration ? parseInt(duration, 10) : null,
        form_data: form as never,
      }).eq("id", tripId).eq("user_id", user.id);
      if (upErr) throw upErr;
      setTripData({ ...(tripData as TravelFormData), ...(form as TravelFormData) });
      useActiveTrip.getState().setActiveTrip({ tripId, destination, arrivalCity: form.arrivalCity, departureDate: next.departureDate || null, returnDate: next.returnDate || null });
      void qc.invalidateQueries({ queryKey: ["trips", user.id] });
      toast.success(t("visa2.profile.saved"));
      return true;
    } catch (e) {
      console.error("[visa] profile save failed", e);
      toast.error(t("visa2.profile.saveError"));
      return false;
    } finally {
      setSavingProfile(false);
    }
  }, [user, tripId, t, setTripData, tripData, qc]);

  const runAnalysis = useCallback(async () => {
    if (missing.length) { toast.error(t("visa2.analysis.completeFirst")); return; }
    if (reached) { setShowUpgrade(true); return; }
    setGenerating(true);
    setError(null);
    try {
      const { data, error: invErr } = await supabase.functions.invoke("visa-info", {
        body: {
          destination: destinationName,
          destinationCode: profile.destinationCode,
          nationality: nationalityName,
          nationalityCode: profile.nationality,
          secondNationality: countryLabel(profile.secondNationality),
          secondNationalityCode: profile.secondNationality,
          residence: countryLabel(profile.residence),
          stayPurpose: t(`prepQuiz.stay.${profile.stayType}.title`, { defaultValue: profile.stayType }),
          durationDays: days,
          departureDate: profile.departureDate,
          passportType: profile.passportType === "other" ? "other (diplomatic/service/travel document)" : "ordinary",
          transitCountries: profile.hasTransit === "yes" ? profile.transitCountries.map(countryLabel) : [],
          regions: [profile.city, profile.regions].filter(Boolean).join(", "),
          locale: lang,
        },
      });
      if (invErr) {
        const status = (invErr as { context?: { status?: number } })?.context?.status;
        if (status === 402) { setShowUpgrade(true); return; }
        if (status === 401) { window.location.assign(`/auth?next=${encodeURIComponent("/guide-visa")}`); return; }
        throw new Error(await friendlyInvokeError(invErr));
      }
      const result = normalizeAnalysis(data);
      if (!result) throw new Error(t("visa2.analysis.incomplete"));
      consume();
      const next: SavedVisaState = { profileKey: pKey, analysis: result, checked: carryChecked(saved?.checked ?? {}, result.checklist) };
      saveVisaState(stateKey, next);
      setSaved(next);
      track("guide_generated", { guide: "visa" });
      toast.success(t("visa2.analysis.done"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("visa2.analysis.error");
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }, [missing.length, reached, destinationName, profile, nationalityName, days, lang, t, consume, pKey, saved?.checked, stateKey]);

  const toggle = (id: string) => {
    if (!saved) return;
    const next = { ...saved, checked: { ...saved.checked, [id]: !saved.checked[id] } };
    saveVisaState(stateKey, next);
    setSaved(next);
  };

  const refreshOfficial = async () => {
    const r = await official.refresh();
    if (!r) return;
    if (r.status === "unavailable") toast.error(r.reason === "quota" ? t("visa2.cards.refreshQuota") : t("visa2.cards.refreshFailed"));
    else toast.success(r.changed ? t("visa2.cards.refreshChanged") : t("visa2.cards.refreshSame"));
  };

  const freeMovement = profile.destinationCode ? hasFreeMovement(profile.destinationCode, [profile.nationality, profile.secondNationality]) : false;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="px-4"><GuestSaveBanner /></div>
      <QuotaBanner tool="visa" toolLabel={t("visa2.toolName")} />
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} toolName={t("visa2.toolName")} />

      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-6 pb-16 sm:px-6">
        <VisaDisclaimer />

        <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_90%_20%,hsl(var(--secondary)/.16),transparent_32%),linear-gradient(145deg,hsl(var(--card)),hsl(var(--background)))] p-6 sm:p-8">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><ShieldCheck className="h-4 w-4" />{t("guideVisa.heroKicker")}</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{destinationName ? t("visa2.titleFor", { destination: destinationName }) : t("guideVisa.title")}</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">{t("visa2.subtitle")}</p>
        </motion.header>

        <VisaProfileCard profile={profile} saving={savingProfile} onSave={saveProfile} />

        {profile.destinationCode && (
          <VisaSummaryCards
            analysis={analysis}
            official={official.data}
            officialLoading={official.loading}
            refreshing={official.refreshing}
            onRefresh={refreshOfficial}
            days={days}
            isFrenchNational={isFrench}
            destinationCode={profile.destinationCode}
          />
        )}

        {/* Analysis call to action */}
        {profile.destinationCode && (
          <section aria-live="polite" className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
            {generating ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
                <RotatingStatusMessage messages={t("guideVisa.rotatingSteps", { returnObjects: true }) as string[]} className="text-sm font-medium text-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    {!analysis ? t("visa2.analysis.ctaTitle") : outdated ? t("visa2.analysis.outdated") : t("visa2.analysis.upToDate")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {missing.length ? t("visa2.analysis.completeFirst") : freeMovement ? t("visa2.analysis.freeMovementHint") : t("visa2.analysis.costHint")}
                  </p>
                </div>
                {(!analysis || outdated) ? (
                  <button type="button" onClick={runAnalysis} disabled={missing.length > 0} className="gradient-button inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
                    <Sparkles className="h-4 w-4" aria-hidden />{analysis ? t("visa2.analysis.rerun") : t("visa2.analysis.run")}
                  </button>
                ) : (
                  <button type="button" onClick={runAnalysis} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                    <RotateCcw className="h-4 w-4" aria-hidden />{t("visa2.analysis.rerun")}
                  </button>
                )}
              </div>
            )}
            {error && !generating && (
              <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
                <span className="flex-1">{t("visa2.analysis.error")} {error}</span>
                <button type="button" onClick={runAnalysis} className="font-semibold text-primary underline">{t("common.retry")}</button>
              </div>
            )}
          </section>
        )}

        {analysis && analysis.checklist.length > 0 && <VisaChecklist items={analysis.checklist} checked={checked} onToggle={toggle} />}

        {profile.destinationCode && <VisaEmergency official={official.data} analysis={analysis} />}

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => setChatOpenSignal((n) => n + 1)} className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/20">
            <MessageCircle className="h-4 w-4" aria-hidden />{t("guideVisa.stepper.reassurance")}
          </button>
          <Link to="/guide-budget" className="inline-flex items-center gap-2 rounded-xl border border-primary/40 px-5 py-3 text-sm font-semibold hover:bg-primary/10">{t("guideVisa.actions.continuePrep")} →</Link>
        </div>
      </main>
      <QuickJump />
      <VisaPipChat destination={destinationName || t("visa2.yourDestination")} nationality={nationalityName} openSignal={chatOpenSignal} />
    </div>
  );
};

export default GuideVisaPage;
