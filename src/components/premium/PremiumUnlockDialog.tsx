import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crown, Lock, Sparkles, Check, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FeatureKey } from "@/lib/traveler-badge";
import type { PremiumPackId } from "@/lib/feature-unlocks";

interface PackTeaser {
  id: PremiumPackId;
  price: number;
  suffix: string;
}

/**
 * Compact pricing grid mirroring the tiers on `/offres`. The full pricing
 * page stays the source of truth for billing details — this dialog is only
 * a persuasive teaser + a CTA that lands the user on `/offres` with the
 * most relevant pack pre-highlighted.
 */
const TEASERS: PackTeaser[] = [
  { id: "admin",         price: 5.99,  suffix: "/mois" },
  { id: "creatif",       price: 5.99,  suffix: "/mois" },
  { id: "ia",            price: 11.99, suffix: "/mois" },
  { id: "intercultural", price: 5.99,  suffix: "/mois" },
  { id: "futur",         price: 12.99, suffix: "/mois" },
  { id: "all",           price: 24.99, suffix: "/mois" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Feature the user tried to open — used only for the title copy. */
  lockedFeature?: FeatureKey | null;
  /** Pack ID to highlight in the grid (derived from the traveler's dominant score). */
  highlightPack?: PremiumPackId;
}

import { hasUnlimitedAccess } from "@/lib/admin-access";

const PremiumUnlockDialog = ({ open, onOpenChange, lockedFeature, highlightPack = "all" }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Admin / dev bypass — never render the paywall for unlimited users.
  if (hasUnlimitedAccess()) {
    if (open) onOpenChange(false);
    return null;
  }

  const goToPricing = () => {
    onOpenChange(false);
    // Pricing page can pick this up via useSearchParams to scroll/highlight.
    navigate(`/offres?highlight=${highlightPack}`);
  };

  const lockedName = lockedFeature
    ? t(`travelerProfile.features.${lockedFeature}.name`, { defaultValue: lockedFeature })
    : t("premiumDialog.genericFeature", { defaultValue: "cette fonctionnalité" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
            <Crown className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-2xl font-extrabold">
            {t("premiumDialog.title", { defaultValue: "Débloque tout Xplania" })}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("premiumDialog.subtitle", {
              feature: lockedName,
              defaultValue: `Passe Premium pour accéder à ${lockedName} et à toutes les autres fonctionnalités.`,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2 my-2">
          {TEASERS.map((p) => {
            const isHighlight = p.id === highlightPack;
            return (
              <div
                key={p.id}
                className={`relative rounded-xl border p-3 transition ${
                  isHighlight
                    ? "border-primary/70 bg-gradient-to-br from-primary/15 to-secondary/10 shadow-md"
                    : "border-border/60 bg-card"
                }`}
              >
                {isHighlight && (
                  <div className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    <Sparkles className="h-3 w-3" />
                    {t("premiumDialog.forYou", { defaultValue: "Pour toi" })}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">
                      {t(`offres.packs.${p.id}.name`, { defaultValue: p.id })}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {t(`offres.packs.${p.id}.tagline`, { defaultValue: "" })}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-extrabold leading-none">{p.price.toFixed(2)}€</div>
                    <div className="text-[10px] text-muted-foreground">{p.suffix}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {[
            t("premiumDialog.benefit1", { defaultValue: "Toutes les IA (visa, budget, valise, mood, carnet)" }),
            t("premiumDialog.benefit2", { defaultValue: "Générations illimitées & exports PDF" }),
            t("premiumDialog.benefit3", { defaultValue: "Sans engagement, résiliable à tout moment" }),
          ].map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("premiumDialog.later", { defaultValue: "Plus tard" })}
          </Button>
          <Button className="gradient-button" onClick={goToPricing}>
            <Lock className="mr-2 h-4 w-4" />
            {t("premiumDialog.cta", { defaultValue: "Voir toutes les offres" })}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUnlockDialog;
