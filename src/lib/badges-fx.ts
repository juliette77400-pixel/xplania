import confetti from "canvas-confetti";
import { toast } from "sonner";

/**
 * Trigger a dopamine-friendly badge unlock feedback:
 * - Multi-burst confetti from both edges
 * - Toast with the badge name
 * Use this anywhere a badge transitions from "locked" to "unlocked".
 */
export function celebrateUnlock(opts: {
  name: string;
  icon?: string;
  description?: string;
}) {
  const { name, icon = "🏆", description } = opts;

  // Confetti — left + right bursts for a "shower" effect
  const defaults = { spread: 90, ticks: 80, gravity: 0.9, decay: 0.94, scalar: 0.9 };
  try {
    confetti({
      ...defaults,
      particleCount: 60,
      origin: { x: 0.05, y: 0.7 },
      angle: 60,
      colors: ["#fbbf24", "#a78bfa", "#22d3ee", "#f472b6"],
    });
    confetti({
      ...defaults,
      particleCount: 60,
      origin: { x: 0.95, y: 0.7 },
      angle: 120,
      colors: ["#fbbf24", "#a78bfa", "#22d3ee", "#f472b6"],
    });
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 80,
        origin: { x: 0.5, y: 0.55 },
        startVelocity: 38,
        colors: ["#fbbf24", "#a78bfa", "#22d3ee", "#f472b6", "#34d399"],
      });
    }, 220);
  } catch {
    // confetti may fail in non-browser env; silently ignore
  }

  toast.success(`Badge débloqué ! ${icon} ${name}`, {
    description: description || "Bravo, continue comme ça ✨",
    duration: 5000,
  });
}

/**
 * Compute a fair "target" for trip-duration-aware badges.
 * Short trips => smaller goals so users can actually unlock.
 */
export function adaptToTripDuration(baseTarget: number, days?: number | null): number {
  if (!days || days <= 0) return baseTarget;
  if (days <= 2) return Math.max(1, Math.ceil(baseTarget * 0.4));
  if (days <= 4) return Math.max(1, Math.ceil(baseTarget * 0.6));
  if (days <= 7) return Math.max(1, Math.ceil(baseTarget * 0.85));
  return baseTarget;
}
