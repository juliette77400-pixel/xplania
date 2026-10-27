// Preparation questionnaire — keeps the swipe-card ("Tinder") look of the former
// quiz, but only asks what the preparation tools need. Answers are saved in the trip.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight, BedDouble, Check, FileCheck, Loader2, RefreshCw, Wallet } from "lucide-react";
import { previewSteps, daysUntil } from "@/lib/prep-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CountryCombobox from "@/components/prep/CountryCombobox";
import { useAuth } from "@/hooks/useAuth";
import { useTrips } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { useActiveTrip } from "@/stores/useActiveTrip";
import { useTravelStore } from "@/stores/useTravelStore";
import {
  PREP_STEPS, STAY_TYPES, DURATION_BUCKETS, HOUSING_OPTIONS, HOUSING_STATUSES,
  emptyPrepAnswers, validatePrepStep, buildTripFromAnswers, countryName, answersFromTrip, GUEST_DRAFT_KEY, PREP_RESUME_PATH, hasCompleteGuestDraft,
  type PrepAnswers, type PrepStep,
} from "@/lib/prep-quiz";
import type { TravelFormData } from "@/types/travel";
import imgDestination from "@/assets/prep-quiz/destination.jpg";
import imgOrigin from "@/assets/prep-quiz/origin.jpg";
import imgDates from "@/assets/prep-quiz/dates.jpg";
import imgBudget from "@/assets/prep-quiz/budget.jpg";
import imgErasmus from "@/assets/prep-quiz/stay-erasmus.jpg";
import imgInternship from "@/assets/prep-quiz/stay-internship.jpg";
import imgOther from "@/assets/prep-quiz/stay-other.jpg";
import imgResidence from "@/assets/prep-quiz/housing-residence.jpg";
import imgFlatshare from "@/assets/prep-quiz/housing-flatshare.jpg";
import imgFamily from "@/assets/prep-quiz/housing-family.jpg";
import imgHousingUnknown from "@/assets/prep-quiz/housing-unknown.jpg";
import imgStatusStarting from "@/assets/prep-quiz/housing-status-starting.jpg";
import imgStatusShortlist from "@/assets/prep-quiz/housing-status-shortlist.jpg";
import imgStatusConfirmed from "@/assets/prep-quiz/housing-status-confirmed.jpg";
import imgStatusLost from "@/assets/prep-quiz/housing-status-lost.jpg";

const STEP_IMAGES: Record<PrepStep, string> = {
  destination: imgDestination,
  origin: imgOrigin,
  stay: imgErasmus,
  dates: imgDates,
  budget: imgBudget,
  housing: imgResidence,
  housingStatus: imgStatusStarting,
};
const STAY_IMAGES = { erasmus: imgErasmus, internship: imgInternship, other: imgOther } as const;
const HOUSING_IMAGES = { residence: imgResidence, flatshare: imgFlatshare, family: imgFamily, unknown: imgHousingUnknown } as const;
const STATUS_IMAGES = { starting: imgStatusStarting, shortlist: imgStatusShortlist, confirmed: imgStatusConfirmed, lost: imgStatusLost } as const;

const SWIPE = 110;
const draftKey = (userId: string) => `xplania:prep-quiz:${userId}`;
const GUEST_DRAFT = GUEST_DRAFT_KEY;
interface GuestDraft { answers: PrepAnswers; step: number; complete?: boolean }
const readGuestDraft = (): GuestDraft | null => {
  try { const raw = localStorage.getItem(GUEST_DRAFT); return raw ? (JSON.parse(raw) as GuestDraft) : null; } catch { return null; }
};
const RESUME_PATH = PREP_RESUME_PATH;
const PREVIEW_ICONS = { visa: FileCheck, housing: BedDouble, budget: Wallet } as const;

const PrepQuiz = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isNewTrip = params.get("new") === "1";
  const { trips, loading: tripsLoading } = useTrips();
  const queryClient = useQueryClient();
  const setActiveTrip = useActiveTrip((s) => s.setActiveTrip);
  const setTripData = useTravelStore((s) => s.setTripData);
  const setRecommendations = useTravelStore((s) => s.setRecommendations);
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();

  const [answers, setAnswers] = useState<PrepAnswers>(emptyPrepAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saved, setSaved] = useState<TravelFormData | null>(null);
  const restored = useRef(false);
  const started = useRef(false);
  const [guestPending] = useState(() => readGuestDraft()?.complete === true);
  const [preview, setPreview] = useState(false);

  const step = PREP_STEPS[stepIndex];
  const isFr = i18n.language.startsWith("fr");

  // Restore an interrupted questionnaire, or pre-fill the origin from a previous trip.
  useEffect(() => {
    if (restored.current) return;
    const picked = (params.get("pays") || "").toUpperCase();
    const pickedCountry = countryName(picked) ? picked : "";
    const prefill = () => {
      if (pickedCountry) setAnswers((a) => (a.destinationCode ? a : { ...a, destinationCode: pickedCountry }));
    };
    if (!user) {
      restored.current = true;
      const g = readGuestDraft();
      const base = { ...emptyPrepAnswers(), ...(g?.answers || {}) };
      if (pickedCountry && base.destinationCode !== pickedCountry) {
        // A country picked on the home page wins: keep the other answers, start at the first card.
        setAnswers({ ...base, destinationCode: pickedCountry });
        setStepIndex(0);
      } else if (g) {
        setAnswers(base);
        setStepIndex(Math.min(Math.max(0, g.step || 0), PREP_STEPS.length - 1));
        if (g.complete) setPreview(true);
      }
      return;
    }
    if (tripsLoading) return;
    restored.current = true;
    // Answers given before signing up: save them as the trip now.
    const g = readGuestDraft();
    if (g?.complete) {
      const a = { ...emptyPrepAnswers(), ...g.answers };
      setAnswers(a);
      setStepIndex(PREP_STEPS.length - 1);
      void persist(a);
      return;
    }
    try {
      const raw = localStorage.getItem(draftKey(user.id));
      if (raw) {
        const d = JSON.parse(raw) as { answers: PrepAnswers; step: number };
        setAnswers({ ...emptyPrepAnswers(), ...d.answers });
        setStepIndex(Math.min(Math.max(0, d.step || 0), PREP_STEPS.length - 1));
        return;
      }
    } catch { /* ignore broken draft */ }
    const last = trips[0];
    if (last) {
      const prev = answersFromTrip(last.form_data as Partial<TravelFormData>, last.destination);
      setAnswers((a) => ({ ...a, nationality: prev.nationality, residence: prev.residence, secondNationality: prev.secondNationality }));
    }
    prefill();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, trips, tripsLoading]);

  useEffect(() => {
    if (!restored.current || saved || saving) return;
    // A finished guest draft is only written by next() or "edit my answers": never overwrite it here,
    // or reopening the preview would wipe the answers before signup.
    if (!user && (preview || hasCompleteGuestDraft())) return;
    try { localStorage.setItem(user ? draftKey(user.id) : GUEST_DRAFT, JSON.stringify({ answers, step: stepIndex })); } catch { /* storage full */ }
  }, [answers, stepIndex, user, saved, saving, preview]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    track("quiz_started", { flow: "prep" });
  }, []);

  const update = <K extends keyof PrepAnswers>(key: K, value: PrepAnswers[K]) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setError(null);
  };

  const labels = useMemo(() => ({
    tripType: answers.stayType ? t(`prepQuiz.stay.${answers.stayType}.title`) : "",
    accommodation: answers.housing ? t(`prepQuiz.housing.${answers.housing}`) : "",
  }), [answers.stayType, answers.housing, t]);

  const persist = useCallback(async (a: PrepAnswers) => {
    if (!user) return;
    setSaving(true);
    setSaveFailed(false);
    const data = buildTripFromAnswers(a, {
      tripType: a.stayType ? t(`prepQuiz.stay.${a.stayType}.title`) : "",
      accommodation: a.housing ? t(`prepQuiz.housing.${a.housing}`) : "",
    });
    const { data: trip, error: insertError } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        title: t("index.tripTitle", { destination: data.destination }),
        destination: data.destination,
        arrival_city: data.arrivalCity,
        departure_location: data.departureLocation || null,
        departure_date: data.departureDate || null,
        return_date: data.returnDate || null,
        duration: data.duration ? parseInt(data.duration, 10) : null,
        form_data: data as never,
      })
      .select("id")
      .single();
    if (insertError || !trip) {
      setSaving(false);
      setSaveFailed(true);
      return;
    }
    track("trip_created", { trip_id: trip.id, flow: "prep_quiz" });
    track("quiz_completed", { flow: "prep", stay: a.stayType });
    await queryClient.invalidateQueries({ queryKey: ["trips"] });
    setTripData(data);
    setRecommendations(null);
    setActiveTrip({
      tripId: trip.id,
      destination: data.destination,
      arrivalCity: data.arrivalCity,
      departureDate: data.departureDate || null,
      returnDate: data.returnDate || null,
    });
    try { localStorage.removeItem(draftKey(user.id)); localStorage.removeItem(GUEST_DRAFT); } catch { /* ignore */ }
    setSaving(false);
    setSaved(data);
  }, [user, t, queryClient, setTripData, setRecommendations, setActiveTrip]);

  const next = useCallback((override?: PrepAnswers) => {
    const a = override ?? answers;
    const invalid = validatePrepStep(step, a);
    if (invalid) { setError(t(invalid)); return false; }
    setError(null);
    track("quiz_step", { flow: "prep", step, index: stepIndex + 1 });
    if (stepIndex === PREP_STEPS.length - 1) {
      if (!user) {
        try { localStorage.setItem(GUEST_DRAFT, JSON.stringify({ answers: a, step: stepIndex, complete: true })); } catch { /* storage full */ }
        track("quiz_completed", { flow: "prep_guest", stay: a.stayType });
        setPreview(true);
        return true;
      }
      void persist(a);
      return true;
    }
    setDirection(1);
    setStepIndex((i) => i + 1);
    return true;
  }, [answers, step, stepIndex, persist, t, user]);

  const back = () => {
    if (stepIndex === 0) return;
    setError(null);
    setDirection(-1);
    setStepIndex((i) => i - 1);
  };

  const choose = <K extends "stayType" | "housing" | "housingStatus">(key: K, value: PrepAnswers[K]) => {
    const a = { ...answers, [key]: value };
    setAnswers(a);
    setError(null);
    window.setTimeout(() => next(a), reduceMotion ? 0 : 260);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE) next();
    else if (info.offset.x < -SWIPE) back();
  };

  // Someone who already has a trip is never pushed back into the questionnaire
  // (except to save the answers they gave before signing up).
  if (user && !isNewTrip && !guestPending && !tripsLoading && trips.length > 0 && !saved && !saving) return <Navigate to="/app" replace />;

  const variants = reduceMotion
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter: (d: number) => ({ x: d * 260, rotate: d * 6, opacity: 0 }),
        center: { x: 0, rotate: 0, opacity: 1 },
        exit: (d: number) => ({ x: -d * 420, rotate: -d * 14, opacity: 0 }),
      };

  const dateLocale = isFr ? "fr-FR" : "en-GB";
  const fmt = (d: string) => new Date(d).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });

  if (!user && preview) {
    const steps = previewSteps(answers);
    const days = daysUntil(answers.departureDate);
    const country = countryName(answers.destinationCode);
    const signup = `/auth?mode=signup&next=${encodeURIComponent(RESUME_PATH)}`;
    const signin = `/auth?next=${encodeURIComponent(RESUME_PATH)}`;
    return (
      <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
        <motion.main id="main-content" tabIndex={-1} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-[2rem] border border-primary/25 bg-card p-6 shadow-[0_20px_60px_hsl(var(--primary)/.15)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{t("prepQuiz.preview.kicker")}</p>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{t("prepQuiz.preview.title", { country })}</h1>
            {days !== null && days >= 0 && <p className="mt-2 text-sm font-semibold text-foreground">{t("prepQuiz.preview.countdown", { count: days })}</p>}
            <ol className="mt-5 space-y-3">
              {steps.map((st, i) => {
                const Icon = PREVIEW_ICONS[st.module];
                return (
                  <li key={st.id} className="flex gap-3 rounded-2xl border border-border/60 bg-background/50 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-button"><Icon className="h-4 w-4 text-primary-foreground" aria-hidden /></span>
                    <span>
                      <span className="block text-xs font-semibold text-primary">{t("prepQuiz.preview.priority", { n: i + 1 })} · {t(`prepQuiz.preview.module.${st.module}`)}</span>
                      <span className="mt-0.5 block text-sm font-medium">{t(`prepQuiz.preview.steps.${st.key}`, { country, ...(st.vars || {}) })}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">{t("prepQuiz.preview.note")}</p>
            <Button className="gradient-button mt-5 h-auto min-h-12 w-full whitespace-normal py-3 text-base leading-snug" onClick={() => navigate(signup)}>
              {t("prepQuiz.preview.cta")}<ArrowRight className="ml-2 h-4 w-4 shrink-0" />
            </Button>
            <button
              type="button"
              onClick={() => {
                // Budget works without an account: hand it the answers, nothing is saved online.
                setTripData(buildTripFromAnswers(answers, labels));
                setRecommendations(null);
                track("cta_click", { cta: "try_budget_guest", location: "prep_preview" });
                navigate("/guide-budget");
              }}
              className="mt-3 w-full rounded-xl border border-border/70 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:bg-primary/10"
            >
              {t("prepQuiz.preview.tryBudget")}
            </button>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <button type="button" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={() => { setPreview(false); try { localStorage.setItem(GUEST_DRAFT, JSON.stringify({ answers, step: stepIndex })); } catch { /* ignore */ } }}>{t("prepQuiz.preview.edit")}</button>
              <Link to={signin} className="font-semibold text-primary hover:underline">{t("prepQuiz.preview.signin")}</Link>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">{t("prepQuiz.preview.free")}</p>
          </div>
        </motion.main>
      </div>
    );
  }

  if (saved) {
    const when = saved.departureDate
      ? `${fmt(saved.departureDate)}${saved.returnDate ? ` → ${fmt(saved.returnDate)}` : ""}`
      : answers.durationBucket ? t(`prepQuiz.dates.bucket.${answers.durationBucket}`) : t("prepQuiz.summary.noDates");
    const rows: Array<[string, string]> = [
      [t("prepQuiz.summary.destination"), saved.arrivalCity && saved.arrivalCity !== saved.destination ? `${saved.arrivalCity}, ${saved.destination}` : saved.destination],
      [t("prepQuiz.summary.stay"), labels.tripType],
      [t("prepQuiz.summary.when"), when],
    ];
    if (saved.totalBudget > 0) rows.push([t("prepQuiz.summary.budget"), `${saved.totalBudget.toLocaleString(dateLocale)} €`]);
    return (
      <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
        <motion.main id="main-content" tabIndex={-1} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-[2rem] border border-primary/25 bg-card shadow-[0_20px_60px_hsl(var(--primary)/.15)]">
            <div className="relative h-44 sm:h-56">
              <img src={imgOther} alt="" className="h-full w-full object-cover" width={768} height={1024} />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute bottom-4 left-6 flex h-12 w-12 items-center justify-center rounded-full gradient-button"><Check className="h-6 w-6 text-primary-foreground" /></div>
            </div>
            <div className="space-y-5 p-6 sm:p-8">
              <div>
                <h1 className="text-2xl font-extrabold sm:text-3xl">{t("prepQuiz.summary.title")}</h1>
                <p className="mt-2 text-muted-foreground">{t("prepQuiz.summary.subtitle")}</p>
              </div>
              <dl className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-background/50">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <Button className="gradient-button h-12 w-full text-base" onClick={() => navigate("/app")}>
                {t("prepQuiz.summary.cta")}<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.main>
      </div>
    );
  }

  const choiceCard = (selected: boolean, img: string, title: string, desc?: string) => (
    <>
      <img src={img} alt="" loading="lazy" width={768} height={1024} className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${selected ? "scale-105" : "group-hover:scale-105"}`} />
      <span className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      {selected && <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full gradient-button"><Check className="h-4 w-4 text-primary-foreground" /></span>}
      <span className="relative mt-auto block p-4 text-left">
        <span className="block text-base font-bold leading-tight text-foreground">{title}</span>
        {desc && <span className="mt-1 block text-xs text-muted-foreground">{desc}</span>}
      </span>
    </>
  );

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${active ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background/50 text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-xl items-center justify-between px-4 pt-6">
        <Link to={user && isNewTrip ? "/app" : "/home"} className="text-lg font-extrabold gradient-text">Xplania</Link>
        <span className="text-xs font-semibold text-muted-foreground">{t("prepQuiz.stepOf", { current: stepIndex + 1, total: PREP_STEPS.length })}</span>
      </header>
      <div className="mx-auto mt-3 max-w-xl px-4">
        <div role="progressbar" aria-label={t("prepQuiz.progress")} aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={PREP_STEPS.length} className="flex gap-1.5">
          {PREP_STEPS.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "gradient-button" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-xl px-4 pb-10 pt-5">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.form
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0.15 : 0.32, ease: [0.22, 0.9, 0.32, 1] }}
            drag={reduceMotion ? false : "x"}
            dragControls={dragControls}
            dragListener={false}
            dragSnapToOrigin
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            onSubmit={(e) => { e.preventDefault(); next(); }}
            noValidate
            className="overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-[0_20px_60px_hsl(var(--primary)/.15)]"
          >
            {/* Image header — drag it left/right like a card to go back / continue */}
            <div
              className="relative h-44 cursor-grab touch-pan-y select-none active:cursor-grabbing sm:h-56"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <img src={STEP_IMAGES[step]} alt="" draggable={false} width={768} height={1024} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            </div>

            <div className="space-y-5 px-6 pb-6 sm:px-8 sm:pb-8">
              <div className="-mt-6 relative">
                <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{t(`prepQuiz.${step}.title`)}</h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t(`prepQuiz.${step}.subtitle`)}</p>
              </div>

              {step === "destination" && (
                <div className="space-y-4">
                  <CountryCombobox autoFocus label={t("prepQuiz.destination.country")} placeholder={t("prepQuiz.destination.countryPlaceholder")} value={answers.destinationCode} onChange={(c) => update("destinationCode", c)} />
                  <div className="space-y-1.5">
                    <Label htmlFor="prep-city">{t("prepQuiz.destination.city")}</Label>
                    <Input id="prep-city" className="h-12 text-base" value={answers.city} onChange={(e) => update("city", e.target.value)} placeholder={t("prepQuiz.destination.cityPlaceholder")} autoComplete="off" />
                  </div>
                </div>
              )}

              {step === "origin" && (
                <div className="space-y-4">
                  <CountryCombobox label={t("prepQuiz.origin.nationality")} placeholder={t("prepQuiz.origin.countryPlaceholder")} value={answers.nationality} onChange={(c) => update("nationality", c)} />
                  <CountryCombobox label={t("prepQuiz.origin.residence")} placeholder={t("prepQuiz.origin.countryPlaceholder")} value={answers.residence} onChange={(c) => update("residence", c)} />
                  <CountryCombobox label={t("prepQuiz.origin.second")} placeholder={t("prepQuiz.origin.secondPlaceholder")} value={answers.secondNationality} onChange={(c) => update("secondNationality", c)} />
                </div>
              )}

              {step === "stay" && (
                <div role="radiogroup" aria-label={t("prepQuiz.stay.title")} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {STAY_TYPES.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={answers.stayType === s} onClick={() => choose("stayType", s)}
                      className={`group relative flex h-36 flex-col overflow-hidden rounded-2xl border-2 sm:h-52 ${answers.stayType === s ? "border-primary" : "border-border/50"}`}>
                      {choiceCard(answers.stayType === s, STAY_IMAGES[s], t(`prepQuiz.stay.${s}.title`), t(`prepQuiz.stay.${s}.desc`))}
                    </button>
                  ))}
                </div>
              )}

              {step === "dates" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="prep-dep">{t("prepQuiz.dates.departure")}</Label>
                      <Input id="prep-dep" type="date" className="h-12 text-base" value={answers.departureDate} onChange={(e) => update("departureDate", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="prep-ret">{t("prepQuiz.dates.return")}</Label>
                      <Input id="prep-ret" type="date" className="h-12 text-base" min={answers.departureDate || undefined} value={answers.returnDate} onChange={(e) => update("returnDate", e.target.value)} />
                    </div>
                  </div>
                  {!(answers.departureDate && answers.returnDate) && (
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">{t("prepQuiz.dates.bucketLegend")}</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {DURATION_BUCKETS.map((b) => (
                          <button key={b} type="button" aria-pressed={answers.durationBucket === b} onClick={() => update("durationBucket", answers.durationBucket === b ? "" : b)} className={chip(answers.durationBucket === b)}>
                            {t(`prepQuiz.dates.bucket.${b}`)}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  <p className="text-xs text-muted-foreground">{t("prepQuiz.dates.hint")}</p>
                </div>
              )}

              {step === "budget" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prep-budget">{t("prepQuiz.budget.label")}</Label>
                    <div className="relative">
                      <Input id="prep-budget" type="number" min={0} inputMode="numeric" disabled={answers.budgetUnknown} className="h-12 pr-12 text-base" value={answers.budget} onChange={(e) => update("budget", e.target.value)} placeholder={t("prepQuiz.budget.placeholder")} />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">€ EUR</span>
                    </div>
                  </div>
                  <button type="button" aria-pressed={answers.budgetUnknown} onClick={() => update("budgetUnknown", !answers.budgetUnknown)} className={`w-full ${chip(answers.budgetUnknown)}`}>
                    {t("prepQuiz.budget.unknown")}
                  </button>
                </div>
              )}

              {step === "housing" && (
                <div role="radiogroup" aria-label={t("prepQuiz.housing.title")} className="grid grid-cols-2 gap-3">
                  {HOUSING_OPTIONS.map((h) => (
                    <button key={h} type="button" role="radio" aria-checked={answers.housing === h} onClick={() => choose("housing", h)}
                      className={`group relative flex h-36 flex-col overflow-hidden rounded-2xl border-2 sm:h-44 ${answers.housing === h ? "border-primary" : "border-border/50"}`}>
                      {choiceCard(answers.housing === h, HOUSING_IMAGES[h], t(`prepQuiz.housing.${h}`))}
                    </button>
                  ))}
                </div>
              )}

              {step === "housingStatus" && (
                <div role="radiogroup" aria-label={t("prepQuiz.housingStatus.title")} className="grid grid-cols-2 gap-3">
                  {HOUSING_STATUSES.map((h) => (
                    <button key={h} type="button" role="radio" aria-checked={answers.housingStatus === h} disabled={saving} onClick={() => choose("housingStatus", h)}
                      className={`group relative flex h-36 flex-col overflow-hidden rounded-2xl border-2 sm:h-44 ${answers.housingStatus === h ? "border-primary" : "border-border/50"}`}>
                      {choiceCard(answers.housingStatus === h, STATUS_IMAGES[h], t(`prepQuiz.housingStatus.${h}`))}
                    </button>
                  ))}
                </div>
              )}

              {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
              {saveFailed && (
                <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span>{t("prepQuiz.saveError")}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => void persist(answers)}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("prepQuiz.retry")}</Button>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={() => (stepIndex === 0 ? navigate("/") : back())} disabled={saving}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />{t("prepQuiz.back")}
                </Button>
                <Button type="submit" className="gradient-button h-11 px-6" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {stepIndex === PREP_STEPS.length - 1 ? t("prepQuiz.finish") : t("prepQuiz.next")}
                  {!saving && <ArrowRight className="ml-1.5 h-4 w-4" />}
                </Button>
              </div>
            </div>
          </motion.form>
        </AnimatePresence>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t("prepQuiz.privacy")}</p>
      </main>
    </div>
  );
};

export default PrepQuiz;
