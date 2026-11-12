// Reads and writes AI results saved with a trip: one copy on the device (fast,
// works offline) and one in the student's account (every device). Only the
// student's own trips can be read or written (row-level security).
import { supabase } from "@/integrations/supabase/client";
import { pickNewest, type AiResultKind, type SavedAiResult } from "@/lib/ai-results";

const PREFIX = "xplania-ai-result";
const localKey = (scope: string, kind: AiResultKind) => `${PREFIX}::${scope}::${kind}`;

function isSaved(v: unknown): v is SavedAiResult {
  const s = v as SavedAiResult | null;
  return !!s && typeof s === "object" && "content" in s && typeof s.updatedAt === "string";
}

export function loadLocalAiResult<T>(scope: string, kind: AiResultKind): SavedAiResult<T> | null {
  try {
    const raw = localStorage.getItem(localKey(scope, kind));
    const parsed = raw ? JSON.parse(raw) : null;
    return isSaved(parsed) ? (parsed as SavedAiResult<T>) : null;
  } catch {
    return null;
  }
}

function saveLocal(scope: string, kind: AiResultKind, value: SavedAiResult) {
  try { localStorage.setItem(localKey(scope, kind), JSON.stringify(value)); } catch { /* storage full */ }
}

async function loadRemote<T>(tripId: string, kind: AiResultKind): Promise<SavedAiResult<T> | null> {
  const { data, error } = await supabase
    .from("trip_ai_results")
    .select("content, input_key, locale, updated_at")
    .eq("trip_id", tripId)
    .eq("kind", kind)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { content: data.content as T, inputKey: data.input_key, locale: data.locale === "en" ? "en" : "fr", updatedAt: data.updated_at };
}

/**
 * The saved result for this trip, newest of device and account.
 * `tripId` is null for visitors or a trip not saved yet: device copy only.
 */
export async function loadAiResult<T>(scope: string, tripId: string | null, kind: AiResultKind, options: { requireRemote?: boolean } = {}): Promise<SavedAiResult<T> | null> {
  const local = loadLocalAiResult<T>(scope, kind);
  if (!tripId) return local;
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) {
    if (options.requireRemote && !local) throw new Error("saved_result_unavailable");
    return local;
  }
  let remote: SavedAiResult<T> | null;
  try { remote = await loadRemote<T>(tripId, kind); }
  catch (error) {
    if (options.requireRemote && !local) throw error;
    return local;
  }
  const best = pickNewest(local, remote);
  if (best && best !== local) saveLocal(scope, kind, best);
  // An older device copy that never reached the account is sent now.
  if (local && best === local && remote !== local && (!remote || Date.parse(local.updatedAt) > Date.parse(remote.updatedAt))) {
    void saveRemote(tripId, kind, local).catch(() => undefined);
  }
  return best;
}

async function saveRemote(tripId: string, kind: AiResultKind, value: SavedAiResult) {
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return;
  const { error } = await supabase.from("trip_ai_results").upsert(
    {
      trip_id: tripId,
      kind,
      user_id: auth.session.user.id,
      input_key: value.inputKey.slice(0, 2000),
      locale: value.locale,
      content: value.content as never,
      updated_at: value.updatedAt,
    },
    { onConflict: "trip_id,kind" },
  );
  if (error) console.warn("[trip-ai-results] save failed", kind, error.message);
}

/** Saves on the device right away and in the account in the background. */
export function saveAiResult<T>(
  scope: string,
  tripId: string | null,
  kind: AiResultKind,
  content: T,
  inputKey: string,
  locale: "fr" | "en",
): SavedAiResult<T> {
  const value: SavedAiResult<T> = { content, inputKey, locale, updatedAt: new Date().toISOString() };
  saveLocal(scope, kind, value);
  if (tripId) void saveRemote(tripId, kind, value).catch(() => undefined);
  return value;
}
