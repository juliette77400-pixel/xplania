import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Footprints, MapPinPlus, Route, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { haversineKm, type Position } from "@/hooks/useGeolocation";
import type { TripActivity } from "@/hooks/useTracking";
import { orderedStops, pathKm } from "@/lib/route-distance";
import AddStopDialog from "./AddStopDialog";

interface Props {
  tripId: string;
  position: Position | null;
  activities: TripActivity[];
  positions: { lat: number; lng: number }[];
  onChanged: () => void;
}

const fmt = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

/** Distances "à vol d'oiseau": traveled path, planned route, remaining — recalculated live. */
const RouteDistances = ({ tripId, position, activities, positions, onChanged }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const stops = useMemo(() => orderedStops(activities), [activities]);

  const traveled = useMemo(() => pathKm([...positions, ...(position ? [position] : [])]), [positions, position]);
  const planned = useMemo(() => pathKm(stops.map((s) => ({ lat: s.lat!, lng: s.lng! }))), [stops]);
  const remaining = useMemo(() => {
    const todo = stops.filter((s) => s.status !== "done").map((s) => ({ lat: s.lat!, lng: s.lng! }));
    if (todo.length === 0) return 0;
    return (position ? haversineKm(position, todo[0]) : 0) + pathKm(todo);
  }, [stops, position]);

  const remove = async (id: string) => {
    await supabase.from("trip_activities").delete().eq("id", id);
    onChanged();
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold"><Route className="h-4 w-4 text-primary" />{t("gmaps.route.title")}</h3>
        <Button size="sm" onClick={() => setOpen(true)}><MapPinPlus className="mr-1.5 h-4 w-4" />{t("gmaps.route.addStop")}</Button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { icon: Footprints, label: t("gmaps.route.traveled"), v: traveled },
          { icon: Route, label: t("gmaps.route.planned"), v: planned },
          { icon: Target, label: t("gmaps.route.remaining"), v: remaining },
        ].map(({ icon: Icon, label, v }) => (
          <div key={label} className="rounded-xl bg-muted/40 p-2">
            <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
            <p className="text-lg font-bold">{fmt(v)}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      {stops.length > 0 && (
        <ol className="space-y-1.5">
          {stops.map((s, i) => {
            const leg = i > 0 ? haversineKm({ lat: stops[i - 1].lat!, lng: stops[i - 1].lng! }, { lat: s.lat!, lng: s.lng! }) : null;
            return (
              <li key={s.id} className="flex items-center gap-2 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{s.title}{s.day_date && <span className="ml-1.5 text-xs text-muted-foreground">· {new Date(s.day_date + "T00:00:00").toLocaleDateString(t("ui2.TripTracker.dateLocale"), { day: "numeric", month: "short" })}</span>}</span>
                {leg !== null && <span className="text-xs text-muted-foreground">+{fmt(leg)}</span>}
                {s.source === "manual" && (
                  <button aria-label={t("gmaps.route.removeStop")} onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <p className="text-xs text-muted-foreground">{t("gmaps.route.birdNote")}</p>
      <AddStopDialog open={open} onOpenChange={setOpen} tripId={tripId} activities={activities}
        near={position ?? (stops[0] ? { lat: stops[0].lat!, lng: stops[0].lng! } : null)} onAdded={onChanged} />
    </section>
  );
};

export default RouteDistances;
