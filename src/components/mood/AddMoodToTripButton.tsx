import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveTrip } from "@/stores/useActiveTrip";
import type { MoodPlace } from "@/hooks/useMoodExplorer";

/** Adds a Mood place as a planned activity of the active trip (itinerary adapts to the mood). */
export default function AddMoodToTripButton({ place }: { place: MoodPlace }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tripId, destination } = useActiveTrip();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!user || !tripId) return null;

  const add = async () => {
    setBusy(true);
    const { error } = await supabase.from("trip_activities").insert({
      trip_id: tripId,
      user_id: user.id,
      source: "mood",
      title: place.name,
      description: place.why_fits || place.description || null,
      category: place.category || null,
      lat: place.lat ?? null,
      lng: place.lng ?? null,
      day_date: new Date().toISOString().slice(0, 10),
      status: "todo",
      position: 999,
      metadata: { mood: place.mood },
    });
    setBusy(false);
    if (error) { toast.error(t("moodComp.trip.error")); return; }
    setDone(true);
    toast.success(t("moodComp.trip.added", { trip: destination || "" }));
  };

  return (
    <Button variant="secondary" className="w-full" onClick={add} disabled={busy || done}>
      {done ? <Check className="w-4 h-4 mr-1.5" /> : <CalendarPlus className="w-4 h-4 mr-1.5" />}
      {done ? t("moodComp.trip.done") : t("moodComp.trip.add")}
    </Button>
  );
}
