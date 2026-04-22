// ✨ NEW (Tâche 3) — Streak quotidien Xplania.
// Stockage 100% local : on enregistre la dernière date d'activité (YYYY-MM-DD).
// Si on agit aujourd'hui :
//   - même jour → streak inchangé
//   - jour suivant → streak +1
//   - sinon → reset à 1
// L'objectif est de motiver l'utilisateur à revenir chaque jour.

const KEY = "xplania_streak_v1";

export interface StreakState {
  streak: number;
  best: number;
  lastDay: string; // YYYY-MM-DD
}

const todayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const dayDiff = (a: string, b: string) => {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
};

export const loadStreak = (): StreakState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as StreakState;
  } catch {}
  return { streak: 0, best: 0, lastDay: "" };
};

const save = (s: StreakState) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
};

/**
 * ✨ Action significative — à appeler depuis les vrais points d'engagement
 * (note carnet, photo, mood partagé, favori, check-in, lieu visité, avis…).
 * Le simple fait d'ouvrir le dashboard NE déclenche PLUS le streak.
 */
export const pingStreakAction = (source?: string): StreakState => {
  if (source && typeof window !== "undefined") {
    try { console.debug(`[streak] action: ${source}`); } catch {}
  }
  return pingStreak();
};

/** @deprecated Utiliser pingStreakAction depuis une vraie action utilisateur. */
export const pingStreak = (): StreakState => {
  const today = todayKey();
  const cur = loadStreak();
  if (!cur.lastDay) {
    const next = { streak: 1, best: 1, lastDay: today };
    save(next);
    return next;
  }
  const diff = dayDiff(cur.lastDay, today);
  let streak = cur.streak;
  if (diff === 0) {
    return cur; // déjà compté aujourd'hui
  } else if (diff === 1) {
    streak += 1;
  } else if (diff > 1) {
    streak = 1; // reset
  } else {
    return cur; // sécurité (clock skew)
  }
  const best = Math.max(cur.best, streak);
  const next = { streak, best, lastDay: today };
  save(next);
  return next;
};

/** Lecture sans modification — pour afficher une carte. */
export const getStreakDisplay = (): StreakState => {
  const cur = loadStreak();
  if (!cur.lastDay) return cur;
  const diff = dayDiff(cur.lastDay, todayKey());
  if (diff > 1) {
    // Le streak est cassé — on l'affiche à 0 jusqu'au prochain ping.
    return { ...cur, streak: 0 };
  }
  return cur;
};
