// Module 1 — where to look. Only hand-checked links, never generated ones.
import { useTranslation } from "react-i18next";
import { Building2, ExternalLink, Info, Landmark, PiggyBank, Search, ShieldAlert, Users } from "lucide-react";
import { resourcesForCountry, VERIFIED_ON, type HousingResource, type ResourceCategory } from "@/data/housing-resources";

const CATEGORY_ICON: Record<ResourceCategory, typeof Building2> = {
  residence: Building2,
  platform: Search,
  flatshare: Users,
  money: PiggyBank,
  fraud: ShieldAlert,
  institutional: Landmark,
};
const CATEGORIES: ResourceCategory[] = ["residence", "platform", "flatshare", "money", "fraud", "institutional"];

interface Props {
  countryCode: string;
  countryName: string;
}

const HousingResources = ({ countryCode, countryName }: Props) => {
  const { t, i18n } = useTranslation();
  const { local, european } = resourcesForCountry(countryCode);
  const all = [...local, ...european];
  const verified = new Date(VERIFIED_ON).toLocaleDateString(i18n.language.startsWith("fr") ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  const card = (r: HousingResource) => {
    const Icon = CATEGORY_ICON[r.category];
    const scope = r.countries.includes("EU") ? t("housing.resources.scopeEurope") : countryName;
    return (
      <li key={r.id} className="flex flex-col rounded-xl border border-border/60 bg-background/50 p-4">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{r.name}</p>
            <p className="text-xs text-muted-foreground">{t(`housing.resources.cat.${r.category}`)} · {scope}</p>
          </div>
        </div>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{t(`housing.resources.items.${r.id}`)}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline">
            {t("housing.resources.open")}<ExternalLink className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">{t("housing.resources.newTab")}</span>
          </a>
          <span className="text-[11px] text-muted-foreground">{t("housing.resources.verified", { date: verified })}</span>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      {/* Always useful, whatever the destination */}
      <div className="flex gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
        <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="font-semibold">{t("housing.resources.schoolTitle")}</p>
          <p className="text-muted-foreground">{t("housing.resources.schoolDesc")}</p>
        </div>
      </div>

      {all.length === 0 ? (
        <div role="status" className="flex gap-3 rounded-xl border border-border/60 bg-background/50 p-4 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">{t("housing.resources.none", { country: countryName || t("housing.resources.yourCountry") })}</p>
        </div>
      ) : (
        CATEGORIES.map((cat) => {
          const items = all.filter((r) => r.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat} aria-label={t(`housing.resources.cat.${cat}`)}>
              <h3 className="mb-2 text-sm font-bold">{t(`housing.resources.cat.${cat}`)}</h3>
              <ul className="grid gap-3 sm:grid-cols-2">{items.map(card)}</ul>
            </section>
          );
        })
      )}
      <p className="text-xs text-muted-foreground">{t("housing.resources.disclaimer")}</p>
    </div>
  );
};

export default HousingResources;
