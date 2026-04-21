// Weekly missions — snapshot localement le compteur de référence
// au 1er affichage de chaque semaine ISO. Le progrès = compteur actuel
// - snapshot de début de semaine. Reset automatique chaque lundi 00:00.

const STORAGE_KEY = "xplania_weekly_missions_v1";

export interface WeeklySnapshot {
  weekKey: string; // ex: "2026-W17"
  startedAt: string; // ISO
  baseline: Record<string, number>;
}

/** ISO week key — Monday-based. */
export function getCurrentWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // Sunday → 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Returns the next Monday at 00:00 in local time. */
export function getNextMonday(d: Date = new Date()): Date {
  const next = new Date(d);
  const day = next.getDay(); // 0=Sun .. 6=Sat
  const diff = day === 0 ? 1 : 8 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function loadSnapshot(): WeeklySnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WeeklySnapshot) : null;
  } catch {
    return null;
  }
}

export function saveSnapshot(s: WeeklySnapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

/**
 * Get-or-create snapshot for current week. If the week changed,
 * the baseline is reset to the current counters (so progress restarts).
 */
export function ensureWeeklySnapshot(currentCounts: Record<string, number>): WeeklySnapshot {
  const wk = getCurrentWeekKey();
  const existing = loadSnapshot();
  if (existing && existing.weekKey === wk) return existing;
  const fresh: WeeklySnapshot = {
    weekKey: wk,
    startedAt: new Date().toISOString(),
    baseline: { ...currentCounts },
  };
  saveSnapshot(fresh);
  return fresh;
}

/** Time-left until next reset, human readable. */
export function formatTimeLeft(now: Date = new Date()): string {
  const next = getNextMonday(now);
  const ms = +next - +now;
  if (ms <= 0) return "Reset imminent";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}j ${hours}h`;
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}
