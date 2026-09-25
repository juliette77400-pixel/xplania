import { useTranslation } from "react-i18next";
import { Route, MapPin, Camera, Wallet, CalendarDays } from "lucide-react";
import type { TripStats } from "@/hooks/useTripStats";

interface Props {
  stats: TripStats | null;
  days: { blocks: { type: string }[] }[];
}

const TripStatsCard = ({ stats, days }: Props) => {
  const { t } = useTranslation();
  const photos = days.reduce((s, d) => s + d.blocks.filter((b) => b.type === "photo").length, 0);
  const locations = days.reduce((s, d) => s + d.blocks.filter((b) => b.type === "location").length, 0);
  const places = Math.max(stats?.placesVisited || 0, locations);

  const items = [
    { icon: Route, label: t("tripStats.km"), value: `${(stats?.distanceKm || 0).toFixed(1)} km` },
    { icon: MapPin, label: t("tripStats.places"), value: String(places) },
    { icon: CalendarDays, label: t("tripStats.days"), value: String(days.length) },
    { icon: Camera, label: t("tripStats.photos"), value: String(photos) },
  ];

  const planned = stats?.budgetPlanned;
  const spent = stats?.budgetSpent;
  const pct = planned && spent != null ? Math.min(100, Math.round((spent / planned) * 100)) : null;

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">📊 {t("tripStats.title")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-muted/30 border border-border p-3">
            <Icon className="w-4 h-4 text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-muted/30 border border-border p-3">
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">{t("tripStats.budget")}</span>
        </div>
        {planned ? (
          <>
            <p className="text-xs text-muted-foreground mt-1">
              {t("tripStats.budgetLine", { spent: Math.round(spent || 0), planned: Math.round(planned) })}
            </p>
            <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">{t("tripStats.noBudget")}</p>
        )}
      </div>
    </section>
  );
};

export default TripStatsCard;
