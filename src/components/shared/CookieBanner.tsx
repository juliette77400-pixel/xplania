import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getConsent, setConsent, subscribeOpenConsentSettings } from "@/lib/consent";

const CookieBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analyticsChoice, setAnalyticsChoice] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
    return subscribeOpenConsentSettings(() => {
      setAnalyticsChoice(getConsent()?.analytics ?? false);
      setExpanded(true);
      setVisible(true);
    });
  }, []);

  const acceptAll = () => {
    setConsent(true);
    setVisible(false);
    setExpanded(false);
  };

  const rejectAll = () => {
    setConsent(false);
    setVisible(false);
    setExpanded(false);
  };

  const save = () => {
    setConsent(analyticsChoice);
    setVisible(false);
    setExpanded(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-x-0 bottom-0 z-[9998] flex justify-center px-4 pb-4"
          role="dialog"
          aria-live="polite"
          aria-label={t("cookies.bannerTitle")}
        >
          <div className="glass-card w-full max-w-2xl rounded-2xl border border-border/50 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{t("cookies.bannerTitle")}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {t("cookies.bannerText")}
                </p>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-background/40 p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t("cookies.analyticsLabel")}</p>
                          <p className="text-xs text-muted-foreground">{t("cookies.analyticsDesc")}</p>
                        </div>
                        <Switch
                          checked={analyticsChoice}
                          onCheckedChange={setAnalyticsChoice}
                          aria-label={t("cookies.analyticsLabel")}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={acceptAll} className="gradient-button text-primary-foreground border-0">
                    {t("cookies.acceptAll")}
                  </Button>
                  <Button onClick={rejectAll} variant="outline">
                    {t("cookies.rejectAll")}
                  </Button>
                  {expanded ? (
                    <Button onClick={save} variant="secondary">
                      {t("cookies.save")}
                    </Button>
                  ) : (
                    <Button onClick={() => setExpanded(true)} variant="ghost" className="gap-1.5">
                      <Settings2 className="h-4 w-4" />
                      {t("cookies.customize")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
