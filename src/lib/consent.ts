// Lightweight first-party consent manager for cookies / analytics.
// Stored in localStorage so the choice survives across sessions.

export interface ConsentState {
  analytics: boolean;
  date: string;
  version: 1;
}

const STORAGE_KEY = "xplania-consent";
const CHANGE_EVENT = "xplania-consent-change";
const OPEN_SETTINGS_EVENT = "xplania-consent-open-settings";

export const getConsent = (): ConsentState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (typeof parsed?.analytics !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
};

export const setConsent = (analytics: boolean): void => {
  const state: ConsentState = {
    analytics,
    date: new Date().toISOString(),
    version: 1,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: state }));
};

export const hasAnalyticsConsent = (): boolean => getConsent()?.analytics === true;

export const subscribeConsent = (cb: (state: ConsentState | null) => void): (() => void) => {
  const handler = (e: Event) => cb((e as CustomEvent<ConsentState>).detail ?? getConsent());
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
};

/** Opens the cookie settings banner from anywhere in the app (e.g. footer link). */
export const openConsentSettings = (): void => {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
};

export const subscribeOpenConsentSettings = (cb: () => void): (() => void) => {
  window.addEventListener(OPEN_SETTINGS_EVENT, cb);
  return () => window.removeEventListener(OPEN_SETTINGS_EVENT, cb);
};
