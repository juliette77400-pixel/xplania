import { useCallback, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  if (status === 402 && body.error === "quota_exceeded") return "quota";
  // 402 without the quota marker = the AI provider has no credits left (not the student's tries).
  if (status === 402 || status === 403) return "ai_unavailable";
  if (status === 429) return "rate";
  return "server";
}

/**
 * One AI call per trip context returning scenarios, a personal analysis,
 * localized deals and saving tips. `refresh()` asks for brand-new ideas.
 */
export function useBudgetInsights(a: Args) {
  const [nonce, setNonce] = useState(0);
  const seen = useRef<string[]>([]);
  const payloadRef = useRef(a);
  payloadRef.current = a;

  const key = [
    "budget-insights", a.destination, a.days, a.travelers, a.locale,
    a.tripData?.departureDate || "", a.tripData?.totalBudget || 0, a.tripData?.arrivalCity || "", a.tripData?.stayType || "", nonce,
  ];

  const query = useQuery({
    queryKey: key,
    enabled: a.enabled && !!a.destination,
    staleTime: Infinity,
    // Keep the current ideas on screen while new ones load (no empty flash, nothing lost on failure).
    placeholderData: keepPreviousData,
    // A missing credit or an exhausted quota will not fix itself on retry.
    retry: (count, err) => count < 1 && !(err instanceof Error && ["quota", "ai_unavailable"].includes(err.message)),
    queryFn: async (): Promise<BudgetInsights> => {
      const { data, error } = await supabase.functions.invoke("budget-tips", { body: buildBody(payloadRef.current, seen.current, nonce) });
      if (error) throw new Error(await insightsErrorKind(error));
      if (data?.error) throw new Error("server");
      const res = data as BudgetInsights;
      const names = [
        ...(res.tips || []).map((t) => t.title),
        ...Object.values(res.deals || {}).flat().map((d) => (d as BudgetPlace).name),
      ];
      seen.current = [...seen.current, ...names].slice(-40);
      return res;
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
    const current = qc.getQueryData<BudgetInsights>(key);
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
      qc.setQueryData<BudgetInsights>(key, { ...current, deals: fresh });
      setDealsState({ loading: false, errorKind: null, noNew: false });
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setDealsState({ loading: false, errorKind: (["quota", "ai_unavailable", "rate"].includes(m) ? m : "server") as InsightsErrorKind, noNew: false });
    } finally {
      dealsBusy.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, nonce, ...key]);
  const msg = query.error instanceof Error ? query.error.message : "";
  const errorKind: InsightsErrorKind | null = query.isError
    ? (["quota", "ai_unavailable", "rate"].includes(msg) ? (msg as InsightsErrorKind) : "server")
    : null;
  return { ...query, refresh, errorKind, regenerateDeals, deals: dealsState };
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
