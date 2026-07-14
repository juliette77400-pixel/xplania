import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { Heart, SkipForward, X, Loader2, Info, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TinderCard, { type TinderCardData } from "@/components/tinder/TinderCard";
import {
  applyScoreTags,
  BADGE_REWARDS,
  calculateBadge,
  emptyScores,
  TRAVELER_DIMENSIONS,
  type TravelerScores,
} from "@/lib/traveler-badge";
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
  const retryTimerRef = useRef<number | null>(null);

  const lang = i18n.language?.startsWith("en") ? "en" : "fr";

  // Load cards + prior swipes. For a logged-in user we read from
  // `user_swipes`; for an anonymous visitor we rehydrate from localStorage.
  useEffect(() => {
    setLocalOnboarding({ step: "tinder" });
    trackOnboardingEvent("step_view", { step: "tinder" });

    let cancelled = false;
    (async () => {
      setLoading(true);
      const cardsQ = supabase
        .from("tinder_cards")
        .select("id, name, image_url, phrase_fr, phrase_en, score_tags, order_index")
        .eq("active", true)
        .order("order_index", { ascending: true });

      const [{ data: allCards, error: e1 }, swipeRes] = await Promise.all([
        cardsQ,
        user
          ? supabase
              .from("user_swipes")
              .select("card_id, direction")
              .eq("user_id", user.id)
          : Promise.resolve({ data: null, error: null } as {
              data: { card_id: string; direction: string }[] | null;
              error: null;
            }),
      ]);
      if (cancelled) return;
      if (e1) {
        toast.error(t("travelerProfile.loadError"));
        setLoading(false);
        return;
      }

      const localSwipes = user ? [] : getLocalOnboarding().swipes;
      const source = user ? swipeRes.data ?? [] : localSwipes;
      const done = new Set(source.map((s) => s.card_id));
      setSwipedIds(done);

      let running = emptyScores();
      const cardsById = new Map((allCards ?? []).map((c) => [c.id, c]));
      for (const s of source) {
        const c = cardsById.get(s.card_id);
        if (!c) continue;
        running = applyScoreTags(
          running,
          c.score_tags as Record<string, number>,
          s.direction as Direction,
        );
      }
      setScores(running);
      setCards((allCards ?? []) as DbCard[]);
      setLoading(false);

      if (done.size > 0 && done.size < (allCards?.length ?? 20)) {
        toast(t("travelerProfile.resumed", { done: done.size, total: allCards?.length ?? 20 }));
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
    };
  }, [user, t]);

  const remaining = useMemo(() => cards.filter((c) => !swipedIds.has(c.id)), [cards, swipedIds]);
  const current = remaining[index] ?? null;
  const next = remaining[index + 1] ?? null;
  const total = cards.length || 20;
  const done = swipedIds.size;
  const progressText = t("travelerProfile.progress", { done, total });

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
      const nextScores = applyScoreTags(scores, current.score_tags, direction);
      setScores(nextScores);
      setSwipedIds((prev) => new Set(prev).add(current.id));
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
      } else {
        pushLocalSwipe({ card_id: current.id, direction });
      }

      if (done + 1 >= total) {
        void finalize(nextScores);
      }
    },
    [current, user, scores, done, total, finalize],
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <div className="mx-auto w-full max-w-md px-4 pt-6 sm:pt-10">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-muted-foreground">
          <span>{t("travelerProfile.title")}</span>
          <span>{progressText}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full gradient-button transition-all"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">{message}</p>
        <div className="mt-2 text-center">
          <Link
            to="/home"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <Info className="h-3 w-3" />
            {t("travelerProfile.learnMore", "En savoir plus sur Xplania")}
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="relative h-[70vh] max-h-[620px] w-full max-w-md">
          <AnimatePresence>
            {nextUi && (
              <TinderCard key={nextUi.id} card={nextUi} onSwipe={() => {}} isTop={false} />
            )}
            {currentUi && (
              <TinderCard key={currentUi.id} card={currentUi} onSwipe={handleSwipe} isTop />
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
    </div>
  );
};

export default TravelerProfileOnboarding;
