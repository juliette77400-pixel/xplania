// Rules for AI results saved with a trip (Visa analysis, Budget tips, Valise
// tip and outfits). Reopening a page, refreshing the browser, switching
// language or changing device shows the saved result: a new AI call happens
// only when the student clicks a "new / update" button.

export type AiResultKind = "visa" | "budget_insights" | "valise_tip" | "valise_outfits";

export interface SavedAiResult<T = unknown> {
  content: T;
  /** Trip facts the result was built from: when they change, offer an update (never automatic). */
  inputKey: string;
  locale: "fr" | "en";
  updatedAt: string;
}

/** The most recent of the device copy and the account copy. */
export function pickNewest<T>(local: SavedAiResult<T> | null, remote: SavedAiResult<T> | null): SavedAiResult<T> | null {
  if (!local) return remote;
  if (!remote) return local;
  return Date.parse(remote.updatedAt) >= Date.parse(local.updatedAt) ? remote : local;
}

/** True when the trip or the language changed since the result was made: show it, and offer an update. */
export function isOutdated(saved: Pick<SavedAiResult, "inputKey" | "locale"> | null, inputKey: string, locale: "fr" | "en"): boolean {
  if (!saved) return false;
  return saved.inputKey !== inputKey || saved.locale !== locale;
}

/** Whether opening the page may call the AI: only when nothing was ever saved and the student did not ask for new ideas. */
export function needsAiCall(saved: SavedAiResult | null, askedForNew: boolean): boolean {
  return askedForNew || !saved;
}
