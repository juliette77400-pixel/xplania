import { motion } from "framer-motion";
import { ShieldAlert, MapPinned, UserCheck, Phone, ExternalLink, AlertTriangle, Loader2, BadgeCheck, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOfficialInfo } from "@/hooks/useOfficialInfo";
import { cn } from "@/lib/utils";

interface SafetyGuideProps {
  destination?: string;
}

const levelColors = [
  "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
  "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400",
  "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  "bg-destructive/10 border-destructive/30 text-destructive",
];

const SafetyGuide = ({ destination }: SafetyGuideProps) => {
  const { t, i18n } = useTranslation();
  const locale: "fr" | "en" = i18n.language.startsWith("fr") ? "fr" : "en";
  const { data: official, loading, refresh } = useOfficialInfo(destination, locale);
  const live = official?.safety;

  const levels = t("guideVisa.safetyGuide.levels", { returnObjects: true }) as Array<{ label: string; description: string }>;
  const risks = t("guideVisa.safetyGuide.risks", { returnObjects: true }) as Array<{ title: string; body: string }>;
  const soloTips = t("guideVisa.safetyGuide.soloTips", { returnObjects: true }) as string[];
  const emergencies = t("guideVisa.safetyGuide.emergencies", { returnObjects: true }) as Array<{ label: string; number: string }>;

  const checkedAt = official?.lastChecked
    ? new Date(official.lastChecked).toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 shadow-md space-y-5"
      aria-labelledby="safety-guide-title"
    >
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center" aria-hidden="true">
            <ShieldAlert className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 id="safety-guide-title" className="text-lg font-bold text-foreground">
              {t("guideVisa.safetyGuide.title")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("guideVisa.safetyGuide.subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
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
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading || !destination}
            aria-label={destination ? t("guideVisa.officialCheck.refreshAria", { destination }) : t("guideVisa.officialCheck.refresh")}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} aria-hidden="true" />
            {loading ? t("guideVisa.officialCheck.refreshing") : t("guideVisa.officialCheck.refresh")}
          </button>
        </div>
      </header>

      {/* Live official advisory for the selected destination */}
      {live && (
        <div
          className={`p-4 rounded-xl border space-y-2 ${levelColors[Math.min(Math.max(live.level, 1), 4) - 1]}`}
          aria-live="polite"
          role="region"
          aria-label={t("guideVisa.officialCheck.liveFor", { destination: official?.destination || destination })}
        >
          <p className="text-xs font-bold">
            {t("guideVisa.officialCheck.liveFor", { destination: official?.destination || destination })}
          </p>
          <p className="text-sm font-bold">{live.level_label}</p>
          <p className="text-xs text-foreground/80">{live.summary}</p>
          {live.zones_to_avoid && live.zones_to_avoid.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-semibold mb-1">⚠️ {t("guideVisa.zonesAvoid")}</p>
              <ul className="space-y-0.5">
                {live.zones_to_avoid.map((z, i) => (
                  <li key={i} className="text-xs text-foreground/80">• {z}</li>
                ))}
              </ul>
            </div>
          )}
          {live.source_url && (
            <a
              href={live.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs hover:underline pt-1"
            >
              {t("guideVisa.officialCheck.viewSource", { source: live.source })}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </div>
      )}

      {/* Levels reference */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">{t("guideVisa.safetyGuide.levelsTitle")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {levels.map((l, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border ${levelColors[i] || levelColors[0]}`}
              role="group"
              aria-label={`${t("guideVisa.safetyGuide.levelAria")} ${i + 1}: ${l.label}`}
            >
              <p className="text-xs font-bold">{l.label}</p>
              <p className="text-xs mt-1 text-foreground/80">{l.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risks */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
          {t("guideVisa.safetyGuide.risksTitle")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {risks.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-xs font-bold text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{r.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Solo */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" aria-hidden="true" />
          {t("guideVisa.safetyGuide.soloTitle")}
        </h3>
        <ul className="space-y-1.5">
          {soloTips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
              <span className="text-primary shrink-0" aria-hidden="true">•</span>
              <span className="text-xs text-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ariane */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
        <div className="flex items-center gap-2">
          <MapPinned className="w-4 h-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-bold text-foreground">{t("guideVisa.safetyGuide.arianeTitle")}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{t("guideVisa.safetyGuide.arianeBody")}</p>
        <a
          href="https://pastel.diplomatie.gouv.fr/fildariane/dyn/public/login.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          aria-label={`${t("guideVisa.safetyGuide.arianeCta")} (${t("guideVisa.safetyGuide.opensNewTab")})`}
        >
          {t("guideVisa.safetyGuide.arianeCta")}
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>

      {/* Emergencies */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Phone className="w-4 h-4 text-destructive" aria-hidden="true" />
          {t("guideVisa.safetyGuide.emergenciesTitle")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {emergencies.map((e, i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-between">
              <span className="text-xs text-foreground">{e.label}</span>
              <span className="text-sm font-bold text-destructive" aria-label={`${e.label}: ${e.number}`}>{e.number}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Official link */}
      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-2 justify-between">
        <p className="text-[11px] text-muted-foreground italic">
          {destination
            ? t("guideVisa.safetyGuide.disclaimerWithDest", { destination })
            : t("guideVisa.safetyGuide.disclaimer")}
        </p>
        <a
          href="https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
          aria-label={`${t("guideVisa.safetyGuide.officialCta")} (${t("guideVisa.safetyGuide.opensNewTab")})`}
        >
          {t("guideVisa.safetyGuide.officialCta")}
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>
    </motion.section>
  );
};

export default SafetyGuide;
