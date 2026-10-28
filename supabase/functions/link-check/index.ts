// Daily job (pg_cron): tests every hand-picked external link and stores the real date of
// each check in link_checks. A failed check keeps the previous success date, so the app
// can show "to re-check" instead of a fake date. Called only with the cron secret.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { CHECKED_LINKS } from "../_shared/checked-links.ts";
import { classifyLink } from "../_shared/link-outcome.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; XplaniaLinkCheck/1.0; +https://xplania.app)",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
};

async function probe(url: string): Promise<{ status: number | null; finalUrl: string | null }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow", headers: HEADERS, signal: ctrl.signal });
      // Only the status matters: drop the body to save bandwidth.
      await res.body?.cancel().catch(() => {});
      if (res.status >= 500 && attempt === 0) continue;
      return { status: res.status, finalUrl: res.url || url };
    } catch {
      if (attempt === 1) return { status: null, finalUrl: null };
    } finally {
      clearTimeout(timer);
    }
  }
  return { status: null, finalUrl: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: okSecret } = await admin.rpc("verify_cron_secret", { _name: "link-check", _secret: req.headers.get("x-cron-secret") ?? "" });
  if (okSecret !== true) return json({ error: "Unauthorized" }, 401);

  const { data: prev } = await admin.from("link_checks").select("url, last_success_at, consecutive_failures");
  const before = new Map((prev ?? []).map((r) => [r.url as string, r]));
  const urls = [...new Set(CHECKED_LINKS)];
  const counts: Record<string, number> = {};
  const rows: Record<string, unknown>[] = [];

  // A few links at a time: polite to the sites, done well within the function time limit.
  const queue = [...urls];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift()!;
      const { status, finalUrl } = await probe(url);
      const outcome = classifyLink(url, status, finalUrl);
      const now = new Date().toISOString();
      const old = before.get(url);
      counts[outcome] = (counts[outcome] || 0) + 1;
      rows.push({
        url, outcome, http_status: status, final_url: finalUrl,
        last_checked_at: now,
        last_success_at: outcome === "ok" ? now : old?.last_success_at ?? null,
        consecutive_failures: outcome === "ok" ? 0 : (old?.consecutive_failures ?? 0) + 1,
        updated_at: now,
      });
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));

  const { error } = await admin.from("link_checks").upsert(rows, { onConflict: "url" });
  if (error) return json({ error: error.message }, 500);
  // Links no longer listed in the app are removed so they never show up as "to re-check".
  const { data: stored } = await admin.from("link_checks").select("url");
  const stale = (stored ?? []).map((r) => r.url as string).filter((u) => !urls.includes(u));
  if (stale.length) await admin.from("link_checks").delete().in("url", stale);
  return json({ checked: rows.length, counts, removed: stale.length });
});
