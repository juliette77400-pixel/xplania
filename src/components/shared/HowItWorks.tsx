import { useTranslation } from "react-i18next";

/** 3-step "How it works" box. Keys: `${prefix}.howTitle`, `${prefix}.howStep{1-3}Title/Desc`. */
export default function HowItWorks({ prefix, className = "" }: { prefix: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <section aria-label={t(`${prefix}.howTitle`)} className={`glass-card rounded-2xl p-4 sm:p-5 ${className}`}>
      <h2 className="text-sm font-bold text-foreground mb-3">{t(`${prefix}.howTitle`)}</h2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{n}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{t(`${prefix}.howStep${n}Title`)}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{t(`${prefix}.howStep${n}Desc`)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
