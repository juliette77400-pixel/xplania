import { useTranslation } from "react-i18next";
import { Calendar, Plane, Wallet, MapPin, Users, Radio } from "lucide-react";
import type { LiveTrip } from "@/hooks/useLiveTrip";

interface Props {
  trip: LiveTrip | null;
}

/**
 * TripParamsCard — central, reactive view of the current trip's main settings.
 * Reads from useLiveTrip which subscribes to the `trips` row in real time, so
 * any edit from another module (form, budget, transport…) shows up here without
 * a page reload.
 */
const TripParamsCard = ({ trip }: Props) => {
  const { t } = useTranslation();
  if (!trip) return null;

  const form = trip.form_data || {};
  const transport = (form.localTransport && form.localTransport.length > 0)
    ? form.localTransport.join(", ")
    : (form.bookingStatus || "—");
  const budget = form.totalBudget ? `${form.totalBudget} €` : "—";
  const travelers = form.travelerType || "—";
  const dates =
    trip.departure_date && trip.return_date
      ? `${trip.departure_date} → ${trip.return_date}`
      : trip.departure_date || "—";

  const items = [
    { icon: MapPin, label: t("suiviTrip.params.destination"), value: trip.destination || trip.arrival_city || "—" },
    { icon: Calendar, label: t("suiviTrip.params.dates"), value: dates },
    { icon: Plane, label: t("suiviTrip.params.transport"), value: transport },
    { icon: Wallet, label: t("suiviTrip.params.budget"), value: budget },
    { icon: Users, label: t("suiviTrip.params.travelers"), value: travelers },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-3.5 h-3.5 text-green-500 animate-pulse" />
        <h3 className="text-sm font-semibold">{t("suiviTrip.params.title")}</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {t("suiviTrip.params.live")}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-muted/30 p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              <Icon className="w-3 h-3" />
              {label}
            </div>
            <p className="text-sm font-medium truncate" title={String(value)}>
              {String(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripParamsCard;
