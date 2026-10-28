// Safety net for the Visa checklist: the AI writes the personalised list, but
// a few points a student must never forget are added here when the AI left
// them out. Texts come from the translation files (no AI, no figures, no links).
import type { ChecklistCategory, ChecklistPriority, VisaChecklistItem } from "@/lib/visa-rules";

export type EssentialId =
  | "passport-validity"
  | "admission-proof"
  | "health-insurance"
  | "internship-authorisation"
  | "residence-registration"
  | "document-copies"
  | "ariane";

export interface EssentialContext {
  /** Stay length in days (0 = unknown). */
  days: number;
  stayType: string;
  /** Free movement between the student's nationality and the destination (EU/EEA/Switzerland). */
  freeMovement: boolean;
  isFrench: boolean;
}

interface EssentialRule {
  id: EssentialId;
  category: ChecklistCategory;
  priority: ChecklistPriority;
  /** Whether the point concerns this student. */
  applies: (c: EssentialContext) => boolean;
  /** The AI already covered the point when one of its items matches. */
  covered: RegExp;
  /** Condition shown under the item (translation key suffix), if any. */
  conditional?: boolean;
  /** Translation key of the detail when it depends on the profile (default "detail"). */
  detailKey?: (c: EssentialContext) => string;
}

export const LONG_STAY_DAYS = 90;

const RULES: EssentialRule[] = [
  { id: "passport-validity", category: "documents", priority: "required", applies: () => true,
    covered: /passport|passeport|identity card|id card|carte d.identit/i },
  { id: "admission-proof", category: "documents", priority: "recommended", applies: () => true,
    covered: /convention|learning agreement|acceptance|admission|enrol?ment|attestation d.inscription|lettre d.accept|offer letter|internship agreement/i },
  { id: "health-insurance", category: "health", priority: "recommended", applies: () => true,
    covered: /insurance|assurance|ceam|ehic|ghic|sécurité sociale|social security|health cover|couverture/i,
    // The European card only works between free-movement countries.
    detailKey: (c) => (c.freeMovement ? "detail" : "detailWorld") },
  { id: "internship-authorisation", category: "documents", priority: "required",
    applies: (c) => c.stayType === "internship" && !c.freeMovement,
    covered: /work permit|permis de travail|autorisation de travail|work authori[sz]|right to work|droit de travailler|working holiday|internship visa|visa (de )?stage|trainee visa|visa stagiaire/i },
  { id: "residence-registration", category: "practical", priority: "if_applicable", conditional: true,
    applies: (c) => c.days > LONG_STAY_DAYS,
    covered: /regist|enregistr|déclar|residence permit|residence card|titre de séjour|permis de séjour|carte de séjour|carte de résident|inscription (à|a) la mairie|town hall|city hall|\bnie\b|anmeldung/i },
  { id: "document-copies", category: "documents", priority: "recommended", applies: () => true,
    covered: /cop(y|ie|ies)|scan|numéris|digital/i },
  { id: "ariane", category: "practical", priority: "recommended", applies: (c) => c.isFrench,
    covered: /ariane/i },
];

const ESSENTIAL_PREFIX = "essential-";

/** Essential points this student needs and the AI checklist does not cover yet. */
export function missingEssentials(items: VisaChecklistItem[], ctx: EssentialContext): EssentialRule[] {
  const ids = new Set(items.map((i) => i.id));
  const text = items.map((i) => `${i.item} ${i.detail}`).join("\n");
  return RULES.filter((r) => r.applies(ctx) && !ids.has(ESSENTIAL_PREFIX + r.id) && !r.covered.test(text));
}

/** The AI checklist completed with the missing essential points (idempotent). */
export function withEssentials(
  items: VisaChecklistItem[],
  ctx: EssentialContext,
  t: (key: string) => string,
): VisaChecklistItem[] {
  const extra = missingEssentials(items, ctx).map((r) => ({
    id: ESSENTIAL_PREFIX + r.id,
    item: t(`visa2.essentials.${r.id}.item`),
    detail: t(`visa2.essentials.${r.id}.${r.detailKey ? r.detailKey(ctx) : "detail"}`),
    category: r.category,
    priority: r.priority,
    condition: r.conditional ? t(`visa2.essentials.${r.id}.condition`) : "",
  }));
  return extra.length ? [...items, ...extra] : items;
}

export const ESSENTIAL_IDS: EssentialId[] = RULES.map((r) => r.id);
