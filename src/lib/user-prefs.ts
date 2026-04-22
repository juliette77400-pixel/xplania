// User preferences stored locally per browser. Quick access without backend roundtrip.
const KEY = "xplania_user_prefs_v1";

export interface UserPrefs {
  preferredCurrency: string; // e.g. "EUR"
  travelerType: string; // free text e.g. "Aventurier", "Famille"
  bio: string;
  notifyInApp: boolean;
  notifyBrowser: boolean;
}

const DEFAULTS: UserPrefs = {
  preferredCurrency: "EUR",
  travelerType: "",
  bio: "",
  notifyInApp: true,
  notifyBrowser: false,
};

export function loadPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UserPrefs>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePrefs(p: Partial<UserPrefs>): UserPrefs {
  const next = { ...loadPrefs(), ...p };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}
