// Results of the daily automatic link check (link_checks table, written by the link-check job).
// A reachable link is NOT proof that the information on the page is still right: the UI keeps
// "link tested" (automatic) separate from "content re-read by hand" (dates in src/data).
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LinkCheck {
  url: string;
  outcome: "ok" | "moved" | "broken" | "blocked" | "error" | "pending";
  last_checked_at: string | null;
  last_success_at: string | null;
}

/** One central read of every result (about 80 rows), shared by every page. */
export function useLinkChecks() {
  return useQuery({
    queryKey: ["link-checks"],
    staleTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<Record<string, LinkCheck>> => {
      const { data, error } = await supabase.from("link_checks").select("url, outcome, last_checked_at, last_success_at");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.url, r as LinkCheck]));
    },
  });
}

export type LinkState =
  | { state: "ok"; checkedAt: string }
  | { state: "recheck"; lastSuccessAt: string | null }
  /** The site refuses automatic visits (robot protection): only a person can check it. */
  | { state: "manual"; lastSuccessAt: string | null }
  | { state: "unknown" };

/** Status of one link: tested OK at its last check, to re-check after a failure, or never tested. */
export function linkState(check: LinkCheck | undefined): LinkState {
  if (!check || !check.last_checked_at || check.outcome === "pending") return { state: "unknown" };
  if (check.outcome === "ok") return { state: "ok", checkedAt: check.last_success_at || check.last_checked_at };
  if (check.outcome === "blocked") return { state: "manual", lastSuccessAt: check.last_success_at };
  return { state: "recheck", lastSuccessAt: check.last_success_at };
}

export interface LinksSummary {
  /** Oldest last-success date among the links: every link worked at least on that date. */
  allOkSince: string | null;
  /** Links whose latest check failed (broken, moved, error). */
  recheck: string[];
  /** Links the site does not let a robot test. */
  manual: string[];
  tested: number;
}

/** Summary for a group of links shown together on a page. */
export function summarizeLinks(urls: string[], checks: Record<string, LinkCheck> | undefined): LinksSummary {
  const recheck: string[] = [];
  const manual: string[] = [];
  let oldest: string | null = null;
  let tested = 0;
  for (const u of new Set(urls)) {
    const s = linkState(checks?.[u]);
    if (s.state === "unknown") continue;
    tested++;
    if (s.state === "recheck") { recheck.push(u); continue; }
    if (s.state === "manual") { manual.push(u); continue; }
    if (!oldest || s.checkedAt < oldest) oldest = s.checkedAt;
  }
  // The date is shown only when every testable link passed: a failure must never hide behind an older date.
  return { allOkSince: recheck.length === 0 && oldest ? oldest : null, recheck, manual, tested };
}
