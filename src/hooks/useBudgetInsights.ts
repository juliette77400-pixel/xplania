import { useCallback, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isAiPause } from "@/lib/ai-pause";
import { isOutdated, needsAiCall, type SavedAiResult } from "@/lib/ai-results";
import { loadAiResult, saveAiResult } from "@/lib/data/trip-ai-results";
import { useActiveTrip } from "@/stores/useActiveTrip";
import type { TravelFormData } from "@/types/travel";

export interface BudgetPlace { name: string; zone: string; city: string; detail: string }
export interface BudgetScenario { total: number; note: string; split: { key: string; amount: number }[] }
export interface BudgetInsights {
  scenarios: { economy: BudgetScenario; realistic: BudgetScenario; comfort: BudgetScenario };
  analysis: { summary: string; points: string[] };
  deals: { activities: BudgetPlace[]; restaurants: BudgetPlace[]; transport: BudgetPlace[]; mood: BudgetPlace[] };
  tips: { title: string; body: string; zone: string; city: string; category: string }[];
}

interface Args {
  enabled: boolean;
  destination: string;
  totalBudget: number;
  days: number;
  travelers: number;
  locale: "fr" | "en";
  categories: { key: string; planned: number; spent: number }[];
  tripData?: TravelFormData | null;
}

/** Why the tips could not be generated: shown to the student in plain words. */
export type InsightsErrorKind = "quota" | "ai_unavailable" | "rate" | "server";

async function insightsErrorKind(error: unknown): Promise<InsightsErrorKind> {
  const ctx = (error as { context?: Response })?.context;
  const status = ctx?.status;
  let body: { error?: string } = {};
  try { if (ctx && typeof ctx.clone === "function") body = await ctx.clone().json(); } catch { /* not JSON */ }
  if (isAiPause(error)) return "ai_unavailable";
  if (status === 402 && body.error === "quota_exceeded") return "quota";
  // 402 without the quota marker = the AI provider has no credits left (not the student's tries).
  if (status === 402 || status === 403) return "ai_unavailable";
  if (status === 429) return "rate";
  return "server";
}

/** Trip facts the tips depend on: when they change, the saved tips get an "update" button. */
export function budgetInsightsInputKey(a: Pick<Args, "destination" | "days" | "travelers" | "tripData">): string {
  const td = a.tripData;
  return [a.destination, a.days, a.travelers, td?.departureDate || "", td?.totalBudget || 0, td?.arrivalCity || "", td?.stayType || ""].join("|");
}

function isInsights(v: unknown): v is BudgetInsights {
  const x = v as BudgetInsights | null;
  return !!x && typeof x === "object" && !!x.scenarios && Array.isArray(x.tips);
}

/**
 * Scenarios, a personal analysis, localized deals and saving tips for a trip.
 * They are saved with the trip (device + account): reopening the page,
 * refreshing or switching language shows them again without a new AI call.
 * Only `refresh()` (or `regenerateDeals()`) asks the AI for new ideas.
 */
export function useBudgetInsights(a: Args) {
  const [nonce, setNonce] = useState(0);
  const seen = useRef<string[]>([]);
  const payloadRef = useRef(a);
  payloadRef.current = a;
  const tripId = useActiveTrip((s) => s.tripId);
  const scope = tripId || `no-trip::${a.destination}::${a.tripData?.departureDate || ""}`;
  const inputKey = budgetInsightsInputKey(a);

  const key = ["budget-insights", scope, nonce];

  const query = useQuery({
    queryKey: key,
    enabled: a.enabled && !!a.destination,
    staleTime: Infinity,
    // On "Régénérer" (same trip, new nonce) keep the current ideas on screen while new ones load.
    // A different trip never shows the previous trip's ideas.
    placeholderData: (prev, prevQuery) =>
      prevQuery && JSON.stringify(prevQuery.queryKey.slice(0, -1)) === JSON.stringify(key.slice(0, -1)) ? keepPreviousData(prev) : undefined,
    // A missing credit or an exhausted quota will not fix itself on retry.
    retry: false,
    queryFn: async (): Promise<SavedAiResult<BudgetInsights>> => {
      const remember = (res: BudgetInsights) => {
        const names = [
          ...(res.tips || []).map((t) => t.title),
          ...Object.values(res.deals || {}).flat().map((d) => (d as BudgetPlace).name),
        ];
        seen.current = [...seen.current, ...names].slice(-40);
      };
      const saved = await loadAiResult<BudgetInsights>(scope, tripId, "budget_insights", { requireRemote: true });
      const usable = saved && isInsights(saved.content) ? saved : null;
      if (usable && !needsAiCall(usable, nonce > 0)) { remember(usable.content); return usable; }
      const p = payloadRef.current;
      const { data, error } = await supabase.functions.invoke("budget-tips", { body: buildBody(p, seen.current, nonce) });
      if (error) throw new Error(await insightsErrorKind(error));
      if (data?.error || !isInsights(data)) throw new Error("server");
      remember(data);
      return saveAiResult(scope, tripId, "budget_insights", data, budgetInsightsInputKey(p), p.locale);
    },
  });

  const qc = useQueryClient();
  const fetchingRef = useRef(false);
  fetchingRef.current = query.isFetching;
  // Repeated clicks while a request runs are ignored: one click = at most one AI call (one try).
  const refresh = useCallback(() => { if (!fetchingRef.current) setNonce((n) => n + 1); }, []);

  /** New optimisation ideas only: scenarios, analysis and tips stay as they are. */
  const [dealsState, setDealsState] = useState<{ loading: boolean; errorKind: InsightsErrorKind | null; noNew: boolean }>({ loading: false, errorKind: null, noNew: false });
  const dealsBusy = useRef(false);
  const regenerateDeals = useCallback(async () => {
    const currentSaved = qc.getQueryData<SavedAiResult<BudgetInsights>>(key);
    const current = currentSaved?.content;
    if (dealsBusy.current || fetchingRef.current || !current) return;
    dealsBusy.current = true;
    setDealsState({ loading: true, errorKind: null, noNew: false });
    try {
      const { data, error } = await supabase.functions.invoke("budget-tips", { body: { ...buildBody(payloadRef.current, seen.current, nonce), only: "deals" } });
      if (error) throw new Error(await insightsErrorKind(error));
      if (data?.error || !data?.deals) throw new Error("server");
      const fresh = filterNewDeals(data.deals as BudgetInsights["deals"], seen.current);
      const count = Object.values(fresh).flat().length;
      if (count === 0) { setDealsState({ loading: false, errorKind: null, noNew: true }); return; }
      seen.current = [...seen.current, ...Object.values(fresh).flat().map((d) => d.name)].slice(-40);
      const p = payloadRef.current;
      qc.setQueryData(key, saveAiResult(scope, tripId, "budget_insights", { ...current, deals: fresh }, budgetInsightsInputKey(p), p.locale));
      setDealsState({ loading: false, errorKind: null, noNew: false });
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setDealsState({ loading: false, errorKind: (["quota", "ai_unavailable", "rate"].includes(m) ? m : "server") as InsightsErrorKind, noNew: false });
    } finally {
      dealsBusy.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, nonce, scope, tripId]);
  const msg = query.error instanceof Error ? query.error.message : "";
  const errorKind: InsightsErrorKind | null = query.isError
    ? (["quota", "ai_unavailable", "rate"].includes(msg) ? (msg as InsightsErrorKind) : "server")
    : null;
  // Saved tips for another trip state or language: shown as they are, with an "update" button.
  const outdated = !query.isFetching && isOutdated(query.data ?? null, inputKey, a.locale);
  return { ...query, data: query.data?.content, refresh, errorKind, regenerateDeals, deals: dealsState, outdated };
}

function buildBody(p: Args, avoid: string[], nonce: number) {
  const td = p.tripData;
  return {
    destination: p.destination,
    totalBudget: p.totalBudget,
    days: p.days,
    travelers: p.travelers,
    locale: p.locale,
    categories: p.categories,
    departureDate: td?.departureDate || "",
    returnDate: td?.returnDate || "",
    tripTypes: td?.tripTypes || [],
    spendingPriorities: td?.spendingPriorities || [],
    accommodationStanding: td?.accommodationStanding || "",
    organization: td?.organization || "",
    rhythm: td?.rhythm || "",
    // Stay facts from the questionnaire: city, kind of stay and housing make the tips local and relevant.
    city: td?.arrivalCity && td.arrivalCity !== td.destination ? td.arrivalCity : "",
    stayType: td?.stayType || "",
    housing: td?.accommodationType || td?.housing || "",
    housingStatus: td?.housingStatus || "",
    avoid,
    seed: `${Date.now()}-${nonce}`,
  };
}

const normName = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Drops ideas already shown, so "Régénérer" never passes an old idea off as new. */
export function filterNewDeals(deals: BudgetInsights["deals"], alreadyShown: string[]): BudgetInsights["deals"] {
  const seenSet = new Set(alreadyShown.map(normName));
  const keep = (list: BudgetPlace[] | undefined) => (list || []).filter((d) => d?.name && !seenSet.has(normName(d.name)));
  return { activities: keep(deals.activities), restaurants: keep(deals.restaurants), transport: keep(deals.transport), mood: keep(deals.mood) };
}
