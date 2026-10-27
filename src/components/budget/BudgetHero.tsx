import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, CalendarDays, MapPin, Sparkles, Wallet } from "lucide-react";
import budgetIllustration from "@/assets/budget/budget-illustration.jpg";

interface Props {
  onGenerate: () => void;
  isGenerating: boolean;
  hasGenerated: boolean;
  /** Empty when the student has not chosen a destination yet (never a made-up city). */
  destination: string;
  /** Null when the length of the stay is unknown. */
  days: number | null;
  initialBudget: number;
}

const BudgetHero = ({ onGenerate, isGenerating, hasGenerated, destination, days, initialBudget }: Props) => {
  const { t } = useTranslation();
  const chip = "inline-flex items-center gap-2 rounded-xl border border-border bg-background/55 px-3 py-2";
  return (
    <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-10 sm:py-16">
      <div className="overflow-hidden rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_85%_15%,hsl(var(--primary)/.14),transparent_30%),linear-gradient(145deg,hsl(var(--card)),hsl(var(--background)))] p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,340px)] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-primary"><Sparkles className="h-4 w-4" />{t("budget.heroBadge")}</p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("budget.heroTitle")}</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">{t("budget.heroSubtitle")}</p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              <span className={chip}><MapPin className="h-4 w-4 text-primary" />{destination || t("budget.heroNoDestination")}</span>
              {days ? <span className={chip}><CalendarDays className="h-4 w-4 text-primary" />{t("budget.configDays", { count: days })}</span> : null}
              <span className={chip}><Wallet className="h-4 w-4 text-primary" />{initialBudget > 0 ? `${initialBudget} €` : t("budget2.kpi.notGiven")}</span>
            </div>
            {!hasGenerated && (
              <button onClick={onGenerate} disabled={isGenerating} className="gradient-button mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-primary-foreground shadow-[0_14px_35px_hsl(var(--primary)/.12)] transition hover:-translate-y-0.5 disabled:opacity-60">
                {isGenerating ? t("budget.heroAnalyzing") : destination ? t("budget.heroCta") : t("budget.heroChooseDestination")}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Decorative: the amounts stay in the text, the picture only sets the mood. */}
          <img
            src={budgetIllustration}
            alt=""
            aria-hidden
            width={1024}
            height={768}
            decoding="async"
            className="mx-auto hidden w-full max-w-[340px] rounded-3xl border border-primary/15 object-cover shadow-[0_20px_60px_hsl(var(--primary)/.12)] sm:block lg:max-w-none"
          />
        </div>
      </div>
    </motion.header>
  );
};
export default BudgetHero;
