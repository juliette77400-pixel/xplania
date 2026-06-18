import { motion } from "framer-motion";
import { Syringe, ShieldCheck, Pill, AlertTriangle, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface VaccinesGuideProps {
  destination?: string;
}

const VaccinesGuide = ({ destination }: VaccinesGuideProps) => {
  const { t } = useTranslation();
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 shadow-md space-y-4"
      aria-labelledby="vaccines-guide-title"
    >
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
          <Syringe className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 id="vaccines-guide-title" className="text-lg font-bold text-foreground">
            {t("guideVisa.vaccinesGuide.title")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("guideVisa.vaccinesGuide.subtitle")}</p>
        </div>
      </header>

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
