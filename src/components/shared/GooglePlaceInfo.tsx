import { Clock, ExternalLink, Globe, Loader2, Phone, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useGooglePlaceDetails } from "@/lib/google-places";

interface Props {
  name: string;
  lat?: number | null;
  lng?: number | null;
}

/** "Infos Google Maps" block: real rating, opening hours, phone, website, photo. */
const GooglePlaceInfo = ({ name, lat, lng }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: g, isLoading, isError } = useGooglePlaceDetails(name, lat, lng, !!user);

  if (!user) return null;
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card/40 p-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("gmaps.info.loading")}
      </div>
    );
  }
  if (isError || !g) return null;

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("gmaps.info.title")}</p>
        {g.open_now !== null && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${g.open_now ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
            {g.open_now ? t("gmaps.info.openNow") : t("gmaps.info.closedNow")}
          </span>
        )}
      </div>
      {g.photo_uri && (
        <figure className="overflow-hidden rounded-lg">
          <img src={g.photo_uri} alt={g.name} className="h-40 w-full object-cover" loading="lazy" />
          {g.photo_attribution && (
            <figcaption className="px-1 pt-1 text-xs text-muted-foreground">{t("gmaps.info.photoBy", { name: g.photo_attribution })}</figcaption>
          )}
        </figure>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {g.rating !== null && (
          <span className="flex items-center gap-1 font-semibold">
            <Star className="h-4 w-4 fill-current text-accent" /> {g.rating.toFixed(1)}
            {g.rating_count ? <span className="text-xs font-normal text-muted-foreground">({g.rating_count})</span> : null}
          </span>
        )}
        {g.type && <span className="text-xs text-muted-foreground">{g.type}</span>}
      </div>
      {g.address && <p className="text-xs text-muted-foreground">{g.address}</p>}
      {g.hours.length > 0 && (
        <details className="text-xs">
          <summary className="flex cursor-pointer items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {t("gmaps.info.hours")}</summary>
          <ul className="mt-1 space-y-0.5 pl-5">{g.hours.map((h) => <li key={h}>{h}</li>)}</ul>
        </details>
      )}
      <div className="flex flex-wrap gap-3 text-xs">
        {g.phone && <a href={`tel:${g.phone}`} className="flex items-center gap-1 text-primary hover:underline"><Phone className="h-3.5 w-3.5" />{g.phone}</a>}
        {g.website && <a href={g.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Globe className="h-3.5 w-3.5" />{t("gmaps.info.website")}</a>}
        {g.maps_uri && <a href={g.maps_uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />{t("gmaps.info.openInMaps")}</a>}
      </div>
    </section>
  );
};

export default GooglePlaceInfo;
