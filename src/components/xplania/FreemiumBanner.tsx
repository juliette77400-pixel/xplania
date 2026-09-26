import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlanStore } from "@/stores/usePlanStore";
import { useTranslation } from "react-i18next";

const FreemiumBanner = () => {
  const { t } = useTranslation();
  const { tier, generationsUsed, freeQuota, bannerDismissed, dismissBanner } =
    usePlanStore();

  const shouldShow =
    tier === "free" && generationsUsed >= freeQuota && !bannerDismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative glass-card rounded-2xl p-4 sm:p-5 mb-4 border border-primary/30 overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div className="relative flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-foreground">
                  {generationsUsed >= freeQuota
                    ? t("ui2.FreemiumBanner.used")
                    : t("ui2.FreemiumBanner.enjoy")}
                </p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary shrink-0">
                  {generationsUsed}/{freeQuota}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                {t("ui2.FreemiumBanner.description")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/offres"
                  className="gradient-button px-4 py-2 rounded-lg text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {t("ui2.FreemiumBanner.discoverPremium")}
                </Link>
                <button
                  onClick={dismissBanner}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("ui2.FreemiumBanner.later")}
                </button>
              </div>
            </div>
            <button
              onClick={dismissBanner}
              aria-label={t("ui2.FreemiumBanner.close")}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FreemiumBanner;
