import { motion } from "framer-motion";
import { Syringe, ShieldCheck, Pill, AlertTriangle, ExternalLink, Loader2, BadgeCheck, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOfficialInfo } from "@/hooks/useOfficialInfo";
import { cn } from "@/lib/utils";

interface VaccinesGuideProps {
  destination?: string;
}

const VaccinesGuide = ({ destination }: VaccinesGuideProps) => {
  const { t, i18n } = useTranslation();
  const locale: "fr" | "en" = i18n.language.startsWith("fr") ? "fr" : "en";
  const { data: official, loading } = useOfficialInfo(destination, locale);
  const live = official?.vaccines;

  const blocks = t("guideVisa.vaccinesGuide.blocks", { returnObjects: true }) as Array<{
    icon: string;
    title: string;
    body: string;
    items?: string[];
  }>;
  const links = t("guideVisa.vaccinesGuide.links", { returnObjects: true }) as Array<{
    label: string;
    url: string;
  }>;

  const iconMap: Record<string, typeof Syringe> = {
    mandatory: AlertTriangle,
    recommended: Syringe,
    uptodate: ShieldCheck,
    chemo: Pill,
  };

  const checkedAt = official?.lastChecked
    ? new Date(official.lastChecked).toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 shadow-md space-y-4"
      aria-labelledby="vaccines-guide-title"
    >
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
            <Syringe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 id="vaccines-guide-title" className="text-lg font-bold text-foreground">
              {t("guideVisa.vaccinesGuide.title")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("guideVisa.vaccinesGuide.subtitle")}</p>
          </div>
        </div>
        {loading && destination && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
            {t("guideVisa.officialCheck.checking")}
          </span>
        )}
        {live && checkedAt && (
          <span
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
            aria-label={t("guideVisa.officialCheck.verifiedAria", { time: checkedAt })}
          >
            <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
            {t("guideVisa.officialCheck.verifiedAt", { time: checkedAt })}
          </span>
        )}
      </header>

      {/* Live official data for this destination */}
      {live && (live.mandatory.length > 0 || live.recommended.length > 0) && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3" aria-live="polite">
          <p className="text-xs font-bold text-primary">
            {t("guideVisa.officialCheck.liveFor", { destination: official?.destination || destination })}
          </p>
          {live.mandatory.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-destructive mb-1">{t("guideVisa.mandatoryVaccines")}</p>
              <div className="flex flex-wrap gap-1.5">
                {live.mandatory.map((v, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-destructive/15 text-destructive font-medium">{v}</span>
                ))}
              </div>
            </div>
          )}
          {live.recommended.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-primary mb-1">{t("guideVisa.recommendedVaccines")}</p>
              <div className="flex flex-wrap gap-1.5">
                {live.recommended.map((v, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-medium">{v}</span>
                ))}
              </div>
            </div>
          )}
          {live.routine_reminder && (
            <p className="text-xs text-muted-foreground">📌 {live.routine_reminder}</p>
          )}
          {live.malaria_risk && live.malaria_risk !== "none" && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              🦟 {t("guideVisa.officialCheck.malariaRisk", { level: t(`guideVisa.officialCheck.risk.${live.malaria_risk}`) })}
            </p>
          )}
          {live.notes && <p className="text-xs text-muted-foreground italic">{live.notes}</p>}
          {live.source_url && (
            <a
              href={live.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {t("guideVisa.officialCheck.viewSource", { source: live.source })}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </div>
      )}

      {/* General reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {blocks.map((b, i) => {
          const Icon = iconMap[b.icon] || Syringe;
          return (
            <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{b.body}</p>
              {b.items && b.items.length > 0 && (
                <ul className="space-y-1 pl-1">
                  {b.items.map((it, j) => (
                    <li key={j} className="text-xs text-foreground flex gap-1.5">
                      <span aria-hidden="true" className="text-primary">•</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-border/40 space-y-2">
        <p className="text-xs font-semibold text-foreground">
          {t("guideVisa.vaccinesGuide.officialTitle")}
        </p>
        <div className="flex flex-wrap gap-2">
          {links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              aria-label={`${l.label} (${t("guideVisa.vaccinesGuide.opensNewTab")})`}
            >
              {l.label}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          {destination
            ? t("guideVisa.vaccinesGuide.disclaimerWithDest", { destination })
            : t("guideVisa.vaccinesGuide.disclaimer")}
        </p>
      </div>
    </motion.section>
  );
};

export default VaccinesGuide;
