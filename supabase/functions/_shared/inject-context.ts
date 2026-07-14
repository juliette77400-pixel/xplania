// Helper: build a personalized Xplania traveler context and return
// the compact prompt snippet ready to inject into any system prompt.
// Fails silently — returns "" so it never breaks callers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildTravelContext, contextToPromptSnippet } from "./travel-context.ts";

export async function getTravelerContextSnippet(
  userId: string | null | undefined,
  locale: "fr" | "en" = "fr",
): Promise<string> {
  if (!userId) return "";
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const ctx = await buildTravelContext(supa, userId);
    return contextToPromptSnippet(ctx, locale);
  } catch (e) {
    console.error("getTravelerContextSnippet failed:", e);
    return "";
  }
}
