import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
    // A missing credit or an exhausted quota will not fix itself on retry.
    retry: (count, err) => count < 1 && !(err instanceof Error && ["quota", "ai_unavailable"].includes(err.message)),
    queryFn: async (): Promise<BudgetInsights> => {
      const p = payloadRef.current;
      const td = p.tripData;
      const { data, error } = await supabase.functions.invoke("budget-tips", {
        body: {
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
          avoid: seen.current,
          seed: `${Date.now()}-${nonce}`,
        },
      });
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

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  const msg = query.error instanceof Error ? query.error.message : "";
  const errorKind: InsightsErrorKind | null = query.isError
    ? (["quota", "ai_unavailable", "rate"].includes(msg) ? (msg as InsightsErrorKind) : "server")
    : null;
  return { ...query, refresh, errorKind };
}
