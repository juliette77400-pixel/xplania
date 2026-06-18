import { useTranslation } from "react-i18next";
import { ExternalLink, Phone, MapPin } from "lucide-react";

interface Props {
  level: 1 | 2 | 3 | 4;
  destination?: string;
  isSolo?: boolean;
}

const levelStyles: Record<number, { bg: string; border: string; text: string; emoji: string }> = {
  1: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-500", emoji: "🟢" },
  2: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-500", emoji: "🟡" },
  3: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500", emoji: "🟠" },
  4: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500", emoji: "🔴" },
};

const SafetyAdvisory = ({ level, destination, isSolo }: Props) => {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");
  const style = levelStyles[level] ?? levelStyles[1];
  const officialUrl = isFr
    ? "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/"
    : "https://www.diplomatie.gouv.fr/en/coming-to-france/";

  const soloTips = t("guideVisa.safety.solo.tips", { returnObjects: true }) as string[];
  const tipsList = Array.isArray(soloTips) ? soloTips : [];

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">{t("guideVisa.safety.title")}</h3>

      <div className={`rounded-2xl p-5 border ${style.bg} ${style.border}`}>
        <div className="flex items-center gap-3 mb-2">
          <span aria-hidden className="text-2xl">{style.emoji}</span>
          <div>
            <p className={`text-sm font-bold ${style.text}`} role="status" aria-label={`level ${level}`}>
              {t(`guideVisa.safety.levels.${level}.label`)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("guideVisa.safety.attribution")}
            </p>
          </div>
        </div>
        <p className="text-sm text-foreground">
          {t(`guideVisa.safety.levels.${level}.summary`, { destination: destination || "" })}
        </p>
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          {t("guideVisa.safety.officialLink")}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {isSolo && (
        <div className="rounded-2xl p-5 bg-primary/5 border border-primary/20 space-y-3">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            🚶‍♀️ {t("guideVisa.safety.solo.title")}
          </h4>
          <ul className="space-y-2">
            {tipsList.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-primary mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
          >
            <MapPin className="w-3 h-3" />
            {t("guideVisa.safety.consulate")}
          </a>
        </div>
      )}

      <div className="rounded-xl p-4 bg-destructive/5 border border-destructive/20 flex items-start gap-3">
        <Phone className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          <span className="font-semibold">🆘 {t("guideVisa.safety.emergencyTitle")} </span>
          <a href="tel:+33177251000" className="font-mono text-destructive hover:underline">
            +33 1 77 25 10 00
          </a>
          <span className="block text-xs text-muted-foreground mt-0.5">
            {t("guideVisa.safety.emergencyNote")}
          </span>
        </p>
      </div>
    </section>
  );
};

export default SafetyAdvisory;
