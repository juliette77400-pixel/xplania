// Card shown in the tools when the trip goes to an island or overseas territory whose
// rules or daily life differ from the mainland (hand-written texts, hand-checked links).
import { useTranslation } from "react-i18next";
import { ExternalLink, Palmtree } from "lucide-react";
import { ISLANDS_CHECKED_ON, OVERSEAS_PASTEUR, islandFor, type Island } from "@/data/islands";
import { findCountry } from "@/lib/country-match";

interface Props {
  destination?: string | null;
  city?: string | null;
  className?: string;
}

export const islandLinks = (island: Island, code: string) => {
  const pasteur = OVERSEAS_PASTEUR[code];
  return pasteur ? [...island.links, { label: "Institut Pasteur — santé", url: pasteur }] : island.links;
};

export function IslandPoints({ island }: { island: Island }) {
  const { t } = useTranslation();
  const points = t(`islands.items.${island.id}.points`, { returnObjects: true });
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {(Array.isArray(points) ? points : []).map((p, i) => <li key={i}>{String(p)}</li>)}
    </ul>
  );
}

const IslandNotice = ({ destination, city, className = "" }: Props) => {
  const { t, i18n } = useTranslation();
  const code = findCountry(destination) || "";
  const island = islandFor(destination, city, code);
  if (!island) return null;
  const place = city?.trim() || destination?.trim() || t(`islands.items.${island.id}.name`);
  const date = new Date(ISLANDS_CHECKED_ON).toLocaleDateString(i18n.language.startsWith("en") ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <section aria-label={t(`islands.items.${island.id}.name`)} className={`rounded-2xl border border-secondary/30 bg-secondary/10 p-5 text-sm leading-6 ${className}`}>
      <p className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-secondary"><Palmtree className="h-4 w-4" aria-hidden />{t("islands.kicker")}</p>
      <h2 className="text-lg font-bold text-foreground">{t(island.kind === "same" ? "islands.sameTitle" : "islands.title", { place })}</h2>
      <div className="mt-2 text-muted-foreground"><IslandPoints island={island} /></div>
      <p className="mt-3 text-xs font-semibold text-foreground">{t("islands.sources")}</p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {islandLinks(island, code).map((l) => (
          <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">{l.label}<ExternalLink className="h-3 w-3" aria-hidden /></a></li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{t("islands.checked", { date })}</p>
    </section>
  );
};

export default IslandNotice;
