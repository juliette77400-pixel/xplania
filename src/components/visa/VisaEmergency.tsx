// Emergency numbers and French consulate from France Diplomatie when the page
// was read; otherwise the AI answer, clearly marked as indicative.
import { useTranslation } from "react-i18next";
import { Building2, Phone } from "lucide-react";
import ReliabilityBadge from "@/components/visa/ReliabilityBadge";
import { sourceOf, type OfficialResult } from "@/hooks/useOfficialInfo";
import type { VisaAnalysis } from "@/lib/visa-rules";
import { formatDay } from "@/lib/format-date";

const VisaEmergency = ({ official, analysis }: { official: OfficialResult | null; analysis: VisaAnalysis | null }) => {
  const { t, i18n } = useTranslation();
  const src = sourceOf(official, "contacts");
  const c = src ? official!.content! : null;
  const hasOfficial = !!c && (c.emergency.length > 0 || !!c.consulate.name);
  const fallback = analysis?.emergency_contacts;
  if (!hasOfficial && !(fallback && (fallback.embassy || fallback.local_emergency))) return null;

  return (
    <section aria-labelledby="visa-emergency-title" className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="visa-emergency-title" className="flex items-center gap-2 text-lg font-bold"><Phone className="h-5 w-5 text-destructive" aria-hidden />{t("visa2.emergency.title")}</h2>
        <ReliabilityBadge level={hasOfficial ? "verified" : "indicative"} />
      </div>
      {hasOfficial ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {c!.emergency.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 p-3">
                <span className="text-sm">{e.label}</span>
                <a href={`tel:${e.number.replace(/[^\d+]/g, "")}`} className="text-sm font-bold text-destructive hover:underline">{e.number}</a>
              </div>
            ))}
          </div>
          {c!.consulate.name && (
            <div className="mt-3 flex gap-3 rounded-xl bg-muted/30 p-3 text-sm">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-semibold">{c!.consulate.name}</p>
                {c!.consulate.address && <p className="text-muted-foreground">{c!.consulate.address}</p>}
                {c!.consulate.phone && <a href={`tel:${c!.consulate.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-primary hover:underline">{c!.consulate.phone}</a>}
              </div>
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            <a href={src!.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{src!.label}</a>
            {src!.updatedAt ? ` · ${t("visa2.cards.updatedOn", { date: formatDay(src!.updatedAt, i18n.language) })}` : ""}
          </p>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          {fallback!.embassy && <div className="rounded-xl bg-muted/30 p-3"><p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("visa2.emergency.embassy")}</p><p className="whitespace-pre-line">{fallback!.embassy}</p></div>}
          {fallback!.local_emergency && <div className="rounded-xl bg-muted/30 p-3"><p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("visa2.emergency.local")}</p><p className="whitespace-pre-line">{fallback!.local_emergency}</p></div>}
          <p className="text-xs text-muted-foreground sm:col-span-2">{t("visa2.emergency.checkOfficial")}</p>
        </div>
      )}
    </section>
  );
};

export default VisaEmergency;
