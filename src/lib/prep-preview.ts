// Personalised preview shown at the end of the questionnaire, before signing
// up: the student's 3 priority steps, computed only from their answers
// (fixed EU rule, housing status, budget). No AI, nothing saved on the server.
import { hasFreeMovement } from "@/lib/visa-rules";
import type { PrepAnswers } from "@/lib/prep-quiz";

export type PreviewModule = "visa" | "housing" | "budget";
export interface PreviewStep {
  id: string;
  module: PreviewModule;
  /** i18n key under prepQuiz.preview.steps */
  key: string;
  vars?: Record<string, string | number>;
  urgency: number;
}

/** Whole days from `today` to the departure date, or null when unknown. */
export function daysUntil(departureDate: string, today: Date = new Date()): number | null {
  if (!departureDate) return null;
  const d = new Date(`${departureDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const t = new Date(today); t.setHours(12, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

export function previewSteps(a: PrepAnswers, today: Date = new Date()): PreviewStep[] {
  const days = daysUntil(a.departureDate, today);
  const soon = days !== null && days >= 0 && days < 60;
  const out: PreviewStep[] = [];

  if (hasFreeMovement(a.destinationCode, [a.nationality, a.secondNationality])) {
    out.push({ id: "visa", module: "visa", key: "visaFree", urgency: 3 });
  } else {
    out.push({ id: "visa", module: "visa", key: soon ? "visaCheckSoon" : "visaCheck", urgency: 1 });
  }

  const housing: Record<string, [string, number]> = {
    lost: ["housingLost", 1],
    starting: ["housingStart", 2],
    shortlist: ["housingCompare", 2],
    confirmed: ["housingSettle", 4],
  };
  const [hKey, hUrg] = housing[a.housingStatus] ?? ["housingStart", 2];
  out.push({ id: "housing", module: "housing", key: hKey, urgency: soon && hUrg === 2 ? 1 : hUrg });

  const amount = a.budgetUnknown ? 0 : Math.max(0, Math.round(Number(a.budget) || 0));
  if (amount > 0) out.push({ id: "budget", module: "budget", key: "budgetFirstMonth", vars: { amount }, urgency: 3 });
  else out.push({ id: "budget", module: "budget", key: "budgetEstimate", urgency: 2 });

  return out.sort((x, y) => x.urgency - y.urgency).slice(0, 3);
}
