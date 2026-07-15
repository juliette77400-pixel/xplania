import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { Heart, SkipForward, X, Loader2, Info, RefreshCw, RotateCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TinderCard, { type TinderCardData } from "@/components/tinder/TinderCard";
import {
  applyScoreTags,
  BADGE_REWARDS,
  calculateBadge,
  emptyScores,
  TRAVELER_DIMENSIONS,
  type TravelerScores,
} from "@/lib/traveler-badge";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  categoryForCard,
  type CategoryKey,
} from "@/lib/tinder-categories";
import { travelerProfileKey } from "@/hooks/useTravelerProfile";
import {
  getLocalOnboarding,
  pushLocalSwipe,
  setLocalOnboarding,
  trackOnboardingEvent,
  type StoredResult,
} from "@/lib/onboarding-state";

type Direction = "right" | "left" | "skip";

interface DbCard {
  id: string;
  name: string;
  image_url: string | null;
  phrase_fr: string;
  phrase_en: string;
  score_tags: Record<string, number>;
  order_index: number;
}

const TravelerProfileOnboarding = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cards, setCards] = useState<DbCard[]>([]);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<TravelerScores>(emptyScores());
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const animatingRef = useRef(false);
  const animTimerRef = useRef<number | null>(null);

  const lang = i18n.language?.startsWith("en") ? "en" : "fr";

  // Load cards + prior swipes. For a logged-in user we read from
  // `user_swipes`; for an anonymous visitor we rehydrate from localStorage.
  useEffect(() => {
    setLocalOnboarding({ step: "tinder" });
    trackOnboardingEvent("step_view", { step: "tinder" });

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const cardsQ = supabase
        .from("tinder_cards")
        .select("id, name, image_url, phrase_fr, phrase_en, score_tags, order_index")
        .eq("active", true)
        .order("order_index", { ascending: true });

      let allCards: DbCard[] | null = null;
      let e1: unknown = null;
      let swipeRes: { data: { card_id: string; direction: string }[] | null; error: unknown } = { data: null, error: null };
      try {
        const [cardsRes, sw] = await Promise.all([
          cardsQ,
          user
            ? supabase.from("user_swipes").select("card_id, direction").eq("user_id", user.id)
            : Promise.resolve({ data: null, error: null } as typeof swipeRes),
        ]);
        allCards = (cardsRes.data ?? null) as DbCard[] | null;
        e1 = cardsRes.error;
        swipeRes = sw as typeof swipeRes;
      } catch (err) {
        e1 = err;
      }
      if (cancelled) return;

      if (e1) {
        const msg = (e1 as { message?: string })?.message || t("travelerProfile.loadError");
        setLoadError(msg);
        setLoading(false);
        // Auto-retry with backoff (max ~30s) as long as the user stays on the page.
        const delay = Math.min(30000, 2000 * Math.pow(2, Math.min(retryTick, 4)));
        if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = window.setTimeout(() => setRetryTick((n) => n + 1), delay);
        return;
      }

      const localSwipes = user ? [] : getLocalOnboarding().swipes;
      const source = user ? swipeRes.data ?? [] : localSwipes;
      const doneIds = new Set(source.map((s) => s.card_id));
      setSwipedIds(doneIds);

      let running = emptyScores();
      const cardsById = new Map((allCards ?? []).map((c) => [c.id, c]));
      for (const s of source) {
        const c = cardsById.get(s.card_id);
        if (!c) continue;
        running = applyScoreTags(running, c.score_tags as Record<string, number>, s.direction as Direction);
      }
      setScores(running);
      setCards((allCards ?? []) as DbCard[]);
      setIndex(0);
      setLoading(false);

      if (doneIds.size > 0 && doneIds.size < (allCards?.length ?? 20)) {
        toast(t("travelerProfile.resumed", { done: doneIds.size, total: allCards?.length ?? 20 }));
      }

      if ((allCards ?? []).some((c) => !c.image_url)) {
        void supabase.functions.invoke("tinder-seed-images").then(() => {
          supabase
            .from("tinder_cards")
            .select("id, name, image_url, phrase_fr, phrase_en, score_tags, order_index")
            .eq("active", true)
            .order("order_index", { ascending: true })
            .then(({ data }) => data && setCards(data as DbCard[]));
        });
      }
    })();
    return () => {
      cancelled = true;
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
    };
  }, [user, t, retryTick]);

  const handleReset = useCallback(async () => {
    if (resetting) return;
    if (!window.confirm(t("travelerProfile.resetConfirm", "Tout effacer et recommencer ce Tinder ?"))) return;
    setResetting(true);
    try {
      if (user) {
        await supabase.from("user_swipes").delete().eq("user_id", user.id);
        // Reset scores on the profile (keeps the row so RLS + onboarding_step stay coherent).
        const clear: Record<string, number | string | null> = { onboarding_step: "tinder", completed_at: null };
        for (const d of TRAVELER_DIMENSIONS) clear[`${d}_score`] = 0;
        await supabase.from("traveler_profiles").upsert({ user_id: user.id, ...clear } as never, { onConflict: "user_id" });
        queryClient.invalidateQueries({ queryKey: travelerProfileKey(user.id) });
      }
      // Always purge local state.
      setLocalOnboarding({ swipes: [], result: null, step: "tinder" });
      setSwipedIds(new Set());
      setScores(emptyScores());
      setIndex(0);
      trackOnboardingEvent("tinder_reset", { authed: !!user });
      toast.success(t("travelerProfile.resetDone", "Profil réinitialisé."));
      setRetryTick((n) => n + 1);
    } catch (err) {
      toast.error((err as { message?: string })?.message || t("travelerProfile.resetError", "Échec de la réinitialisation."));
    } finally {
      setResetting(false);
    }
  }, [user, resetting, queryClient, t]);


  // Precompute category per card and per-category stats.
  const cardCategory = useMemo(() => {
    const m = new Map<string, CategoryKey>();
    for (const c of cards) m.set(c.id, categoryForCard(c.score_tags));
    return m;
  }, [cards]);

  const categoriesPresent = useMemo(() => {
    const set = new Set<CategoryKey>();
    for (const c of cards) set.add(cardCategory.get(c.id) ?? "immersion");
    return CATEGORY_ORDER.filter((k) => set.has(k));
  }, [cards, cardCategory]);

  const categoryStats = useMemo(() => {
    const stats = new Map<CategoryKey, { total: number; done: number }>();
    for (const c of cards) {
      const k = cardCategory.get(c.id) ?? "immersion";
      const s = stats.get(k) ?? { total: 0, done: 0 };
      s.total += 1;
      if (swipedIds.has(c.id)) s.done += 1;
      stats.set(k, s);
    }
    return stats;
  }, [cards, cardCategory, swipedIds]);

  // If the user jumps to a category via the pills, the queue is filtered to
  // that category's unswiped cards; when it empties we drop the filter so the
  // rest of the deck resumes seamlessly.
  const remaining = useMemo(() => {
    const base = cards.filter((c) => !swipedIds.has(c.id));
    if (!activeCategory) return base;
    return base.filter((c) => cardCategory.get(c.id) === activeCategory);
  }, [cards, swipedIds, activeCategory, cardCategory]);

  useEffect(() => {
    if (activeCategory && remaining.length === 0) {
      setActiveCategory(null);
      setIndex(0);
    }
  }, [activeCategory, remaining.length]);

  // `remaining` already excludes swiped cards, so the top card is always
  // remaining[0]. Do NOT add an incrementing index here — combining an
  // incrementing index with a filter that drops swiped cards causes every
  // other card to be skipped (regression from wave 2).
  void index; // kept for legacy reset calls; not used to pick the current card
  const current = remaining[0] ?? null;
  const next = remaining[1] ?? null;
  const total = cards.length;
  const done = swipedIds.size;
  const currentCategoryKey: CategoryKey | null = current
    ? cardCategory.get(current.id) ?? null
    : activeCategory;
  const currentCategory = currentCategoryKey ? CATEGORIES[currentCategoryKey] : null;
  const questionNumber = Math.min(done + 1, Math.max(total, 1));
  const progressText = total > 0
    ? t("travelerProfile.questionOf", { current: questionNumber, total, defaultValue: "Question {{current}}/{{total}}" })
    : "";

  const jumpToCategory = useCallback((k: CategoryKey) => {
    if (animatingRef.current) return;
    setActiveCategory((prev) => (prev === k ? null : k));
    setIndex(0);
  }, []);

  const message = useMemo(() => {
    if (done < 5) return t("travelerProfile.msg1");
    if (done < 10) return t("travelerProfile.msg2");
    if (done < 15) return t("travelerProfile.msg3");
    return t("travelerProfile.msg4");
  }, [done, t]);

  const finalize = useCallback(
    async (finalScores: TravelerScores) => {
      setFinalizing(true);
      const badge = calculateBadge(finalScores);
      const reward = BADGE_REWARDS[badge.key];
      const result: StoredResult = {
        badge: badge.key,
        scores: finalScores,
        features: [...badge.features],
        reward_points: reward.points,
        reward_unlocks: [...reward.unlocks],
        completed_at: new Date().toISOString(),
      };
      // Always cache locally so the result screen can render without auth.
      setLocalOnboarding({ result, step: "resultat" });
      trackOnboardingEvent("tinder_complete", {
        badge: badge.key,
        authed: !!user,
      });

      if (user) {
        const row: Record<string, number | string | string[] | null> = {
          user_id: user.id,
          badge: badge.key,
          recommended_features: badge.features as unknown as string[],
          reward_points: reward.points,
          reward_unlocks: reward.unlocks as unknown as string[],
          completed_at: result.completed_at,
          onboarding_step: "resultat",
        };
        for (const d of TRAVELER_DIMENSIONS) {
          row[`${d}_score`] = Math.max(0, finalScores[d] ?? 0);
        }
        const { error } = await supabase
          .from("traveler_profiles")
          .upsert(row as never, { onConflict: "user_id" });
        if (error) {
          toast.error(t("travelerProfile.saveError"));
          setFinalizing(false);
          return;
        }
        queryClient.invalidateQueries({ queryKey: travelerProfileKey(user.id) });
      }
      navigate("/profil-voyageur/resultat", { replace: true });
    },
    [user, t, queryClient, navigate],
  );

  const handleSwipe = useCallback(
    async (direction: Direction) => {
      if (!current) return;
      // Lock: ignore any subsequent swipe until the previous card animation ends.
      if (animatingRef.current || finalizing) return;
      animatingRef.current = true;
      if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
      animTimerRef.current = window.setTimeout(() => {
        animatingRef.current = false;
      }, 400);

      const nextScores = applyScoreTags(scores, current.score_tags, direction);
      setScores(nextScores);
      setSwipedIds((prev) => {
        if (prev.has(current.id)) return prev; // guard against double-count
        const next = new Set(prev);
        next.add(current.id);
        return next;
      });
      setIndex((i) => i + 1);

      // Persist immediately: DB when logged in, localStorage otherwise.
      if (user) {
        supabase
          .from("user_swipes")
          .upsert(
            { user_id: user.id, card_id: current.id, direction },
            { onConflict: "user_id,card_id" },
          )
          .then(({ error }) => {
            if (error) console.warn("swipe write failed", error);
          });
        const partial: Record<string, number | string> = {
          user_id: user.id,
          onboarding_step: "tinder",
        };
        for (const d of TRAVELER_DIMENSIONS) {
          partial[`${d}_score`] = Math.max(0, nextScores[d] ?? 0);
        }
        supabase
          .from("traveler_profiles")
          .upsert(partial as never, { onConflict: "user_id" })
          .then(({ error }) => {
            if (error) console.warn("profile score sync failed", error);
          });
      } else {
        pushLocalSwipe({ card_id: current.id, direction });
      }

      // Only finalize when the LAST card of a non-empty deck has been swiped.
      const alreadySwiped = swipedIds.has(current.id);
      const newDone = alreadySwiped ? swipedIds.size : swipedIds.size + 1;
      if (cards.length > 0 && newDone >= cards.length) {
        void finalize(nextScores);
      }
    },
    [current, user, scores, swipedIds, cards.length, finalize, finalizing],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finalizing || !current) return;
      if (e.key === "ArrowRight") handleSwipe("right");
      else if (e.key === "ArrowLeft") handleSwipe("left");
      else if (e.code === "Space") { e.preventDefault(); handleSwipe("skip"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSwipe, finalizing, current]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="mx-auto w-full max-w-md px-4 pt-6 sm:pt-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-14 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-2 w-full rounded-full bg-muted" />
          <div className="h-3 w-2/3 mx-auto rounded bg-muted animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="relative h-[70vh] max-h-[620px] w-full max-w-md rounded-3xl border border-border/40 bg-card overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-background animate-pulse" />
            <div className="absolute inset-x-0 bottom-0 p-6 space-y-3">
              <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-6 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md items-center justify-center gap-6 px-4 pb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 w-14 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-destructive" />
        </div>
        <div className="max-w-md space-y-1">
          <h2 className="text-lg font-bold">{t("travelerProfile.loadErrorTitle", "Chargement impossible")}</h2>
          <p className="text-sm text-muted-foreground">{t("travelerProfile.loadErrorHint", "Impossible de récupérer les cartes. Vérifie ta connexion — on réessaye toutes les quelques secondes.")}</p>
          <p className="text-[11px] font-mono text-muted-foreground/70 break-all pt-1">{loadError}</p>
        </div>
        <button
          onClick={() => setRetryTick((n) => n + 1)}
          className="gradient-button inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          {t("travelerProfile.retryNow", "Réessayer maintenant")}
        </button>
      </div>
    );
  }

  if (!loading && cards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Info className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="max-w-md space-y-1">
          <h2 className="text-lg font-bold">{t("travelerProfile.emptyTitle", "Aucune carte disponible")}</h2>
          <p className="text-sm text-muted-foreground">{t("travelerProfile.emptyHint", "Aucune carte n'est disponible pour le moment. Réessaie dans quelques instants.")}</p>
        </div>
        <button
          onClick={() => setRetryTick((n) => n + 1)}
          className="gradient-button inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          {t("travelerProfile.retry", "Réessayer")}
        </button>
      </div>
    );
  }

  if (finalizing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-semibold text-muted-foreground">{t("travelerProfile.computing")}</p>
      </div>
    );
  }

  const currentUi: TinderCardData | null = current
    ? { id: current.id, image_url: current.image_url, phrase: lang === "en" ? current.phrase_en : current.phrase_fr }
    : null;
  const nextUi: TinderCardData | null = next
    ? { id: next.id, image_url: next.image_url, phrase: lang === "en" ? next.phrase_en : next.phrase_fr }
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Persistent exit CTA — always reachable, discreet, thumb-friendly on mobile. */}
      <button
        type="button"
        onClick={() => setShowExitConfirm(true)}
        aria-label={t("travelerProfile.exit", "Quitter le quiz")}
        className="fixed left-3 top-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground hover:border-border"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("travelerProfile.exit", "Quitter")}
      </button>

      <div className="mx-auto w-full max-w-md px-4 pt-14 sm:pt-16">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-muted-foreground">
          <span>{t("travelerProfile.title")}</span>
          <span aria-live="polite">{progressText}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full gradient-button transition-all"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">{message}</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <Link
            to="/home"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <Info className="h-3 w-3" />
            {t("travelerProfile.learnMore", "En savoir plus sur Xplania")}
          </Link>
          {done > 0 && (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              {resetting
                ? t("travelerProfile.resetting", "Réinitialisation…")
                : t("travelerProfile.resetCta", "Refaire à zéro")}
            </button>
          )}
        </div>
      </div>

      {/* Category pills — horizontal, scrollable, with per-category progress dots. */}
      {categoriesPresent.length > 1 && (
        <div className="mx-auto w-full max-w-2xl px-2 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoriesPresent.map((k) => {
              const cat = CATEGORIES[k];
              const stat = categoryStats.get(k) ?? { total: 0, done: 0 };
              const isActive = (currentCategoryKey ?? null) === k;
              const isFilterOn = activeCategory === k;
              const complete = stat.done >= stat.total && stat.total > 0;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => jumpToCategory(k)}
                  className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive || isFilterOn
                      ? `${cat.border} ${cat.chipBg} ${cat.accent} ring-2 ${cat.ring}`
                      : `border-border/60 bg-card/60 text-muted-foreground hover:text-foreground`
                  } ${complete ? "opacity-70" : ""}`}
                  aria-pressed={isFilterOn}
                  aria-label={`${cat.fallback} — ${stat.done}/${stat.total}`}
                >
                  <cat.Icon className="h-3.5 w-3.5" />
                  <span>{cat.fallback}</span>
                  <span className="ml-1 flex items-center gap-0.5">
                    {Array.from({ length: stat.total }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${
                          i < stat.done ? (isActive || isFilterOn ? "bg-current" : "bg-primary") : "bg-muted"
                        }`}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="relative h-[70vh] max-h-[620px] w-full max-w-md">
          {currentCategory && (
            <div className="pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full border ${currentCategory.border} ${currentCategory.chipBg} px-3 py-1 text-xs font-bold ${currentCategory.accent} shadow-lg backdrop-blur`}
              >
                <currentCategory.Icon className="h-3.5 w-3.5" />
                <span className="uppercase tracking-wide">{currentCategory.fallback}</span>
              </div>
            </div>
          )}
          <AnimatePresence>
            {nextUi && (
              <TinderCard
                key={nextUi.id}
                card={nextUi}
                onSwipe={() => {}}
                isTop={false}
                category={next ? CATEGORIES[cardCategory.get(next.id) ?? "immersion"] : undefined}
              />
            )}
            {currentUi && (
              <TinderCard
                key={currentUi.id}
                card={currentUi}
                onSwipe={handleSwipe}
                isTop
                category={currentCategory ?? undefined}
              />
            )}
          </AnimatePresence>
          {!currentUi && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              {t("travelerProfile.almostDone")}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md items-center justify-center gap-6 px-4 pb-8">
        <button
          onClick={() => handleSwipe("left")}
          disabled={!current}
          aria-label={t("travelerProfile.notMe")}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-400/40 bg-card text-rose-400 shadow transition hover:scale-110 disabled:opacity-40"
        >
          <X className="h-7 w-7" />
        </button>
        <button
          onClick={() => handleSwipe("skip")}
          disabled={!current}
          aria-label={t("common.skip")}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow transition hover:scale-110 disabled:opacity-40"
        >
          <SkipForward className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleSwipe("right")}
          disabled={!current}
          aria-label={t("travelerProfile.forMe")}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-green-400/40 bg-card text-green-400 shadow transition hover:scale-110 disabled:opacity-40"
        >
          <Heart className="h-7 w-7" />
        </button>
      </div>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("travelerProfile.exitTitle", "Quitter le quiz ?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("travelerProfile.exitDesc", "Ta progression est sauvegardée automatiquement. Tu pourras reprendre où tu t'es arrêté(e).")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("travelerProfile.exitStay", "Continuer le quiz")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/home")}>
              {t("travelerProfile.exitConfirm", "Quitter")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TravelerProfileOnboarding;
