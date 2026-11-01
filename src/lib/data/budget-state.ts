// Budget amounts, categories, expenses and incomes are saved with the trip:
// on the device (the key every tool already reads) and in the student's account,
// so another device gets the same numbers. The newest save wins; nothing here
// calls the AI.
import { loadAiResult, saveAiResult } from "@/lib/data/trip-ai-results";
import { PREP_PROGRESS_EVENT } from "@/lib/prep-progress";

export type SavedBudgetState = { hasGenerated?: boolean; savedAt?: number; [key: string]: unknown };

export const budgetStorageKey = (destination: string | null | undefined, departureDate: string | null | undefined) =>
  `xplania-budget-state::${destination || "Paris"}::${departureDate || "na"}`;

const accountScope = (storageKey: string) => `budget-state::${storageKey}`;
const savedAtOf = (s: SavedBudgetState | null | undefined) => (s && Number.isFinite(Number(s.savedAt)) ? Number(s.savedAt) : 0);

/**
 * Which copy to keep. A copy only counts once a budget was created.
 * "push" means the device copy is newer and must be sent to the account.
 */
export function decideBudgetSync(local: SavedBudgetState | null, remote: SavedBudgetState | null): { use: "local" | "remote" | "none"; push: boolean } {
  const l = local?.hasGenerated ? local : null;
  const r = remote?.hasGenerated ? remote : null;
  if (!l && !r) return { use: "none", push: false };
  if (!l) return { use: "remote", push: false };
  if (!r) return { use: "local", push: true };
  if (savedAtOf(r) > savedAtOf(l)) return { use: "remote", push: false };
  return { use: "local", push: savedAtOf(l) > savedAtOf(r) };
}

function readLocal(storageKey: string): SavedBudgetState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as SavedBudgetState) : null;
  } catch {
    return null;
  }
}

/** Sends this device's budget to the account (background, own trips only). */
export function pushBudgetState(storageKey: string, tripId: string | null, state: SavedBudgetState) {
  if (!tripId || !state?.hasGenerated) return;
  saveAiResult(accountScope(storageKey), tripId, "budget_state", state, "", "fr");
}

/**
 * Brings the account copy to this device when it is newer (and tells the
 * dashboard), or sends the device copy when the account has none or an older one.
 */
export async function syncBudgetState(storageKey: string, tripId: string | null): Promise<{ state: SavedBudgetState | null; fromAccount: boolean }> {
  const local = readLocal(storageKey);
  if (!tripId) return { state: local, fromAccount: false };
  const saved = await loadAiResult<SavedBudgetState>(accountScope(storageKey), tripId, "budget_state").catch(() => null);
  const remote = saved?.content && typeof saved.content === "object" ? saved.content : null;
  const d = decideBudgetSync(local, remote);
  if (d.use === "remote" && remote) {
    try { localStorage.setItem(storageKey, JSON.stringify(remote)); } catch { /* storage full */ }
    window.dispatchEvent(new Event(PREP_PROGRESS_EVENT));
    return { state: remote, fromAccount: true };
  }
  if (d.push && local) pushBudgetState(storageKey, tripId, local);
  return { state: local, fromAccount: false };
}
