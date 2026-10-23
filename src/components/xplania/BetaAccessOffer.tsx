// Free beta access card shown on /offres while paid plans are switched off.
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, FileCheck, Globe2, GraduationCap, Luggage, Wallet } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import { useAuth } from "@/hooks/useAuth";
import { PREPARATION_HOME } from "@/config/featureFlags";

const TOOLS = [
  { key: "budget", icon: Wallet },
  { key: "visa", icon: FileCheck },
  { key: "valise", icon: Luggage },
  { key: "culture", icon: Globe2 },
] as const;

const BetaAccessOffer = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const included = ["inc1", "inc2", "inc3", "inc4"].map((k) => t(`betaOffer.${k}`));

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden />{t("betaOffer.tag")}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">{t("betaOffer.title")}</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("betaOffer.subtitle")}</p>
        </motion.header>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-10 rounded-[1.75rem] border border-primary/30 bg-card/60 p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{t("betaOffer.planName")}</h2>
              <p className="text-sm text-muted-foreground">{t("betaOffer.planTagline")}</p>
            </div>
            <p className="text-4xl font-extrabold">{t("betaOffer.price")}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {TOOLS.map(({ key, icon: Icon }) => (
              <div key={key} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/60 p-4">
                <div className="gradient-button flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"><Icon className="h-4 w-4 text-primary-foreground" /></div>
                <div>
                  <p className="font-semibold">{t(`prepDashboard.modules.${key}.title`)}</p>
                  <p className="text-xs text-muted-foreground">{t(`prepDashboard.modules.${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>

          <ul className="mt-6 space-y-2.5">
            {included.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="h-3 w-3" /></span>
                {f}
              </li>
            ))}
          </ul>

          <Link to={user ? PREPARATION_HOME : "/auth?mode=signup"}
            className="gradient-button mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-primary-foreground sm:w-auto">
            {t("betaOffer.cta")}<ArrowRight className="h-4 w-4" />
          </Link>
        </motion.section>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("betaOffer.after")}</p>
      </main>
    </div>
  );
};

export default BetaAccessOffer;
