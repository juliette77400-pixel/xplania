import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTrips } from "@/hooks/useTrips";
import { toast } from "sonner";
import type { Place } from "@/hooks/useDiscover";
import { categoryByKey } from "@/lib/discover";

interface Props {
  place: Place | null;
  open: boolean;
  onClose: () => void;
}

// Build inclusive list of YYYY-MM-DD days between two dates
function dayRange(start: string | null, end: string | null): string[] {
  if (!start) return [];
  const s = new Date(start + "T00:00:00");
  const e = end ? new Date(end + "T00:00:00") : s;
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return [];
  const out: string[] = [];
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const AddToItineraryDialog = ({ place, open, onClose }: Props) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { trips, loading: tripsLoading } = useTrips();
  const [tripId, setTripId] = useState<string>("");
  const [day, setDay] = useState<string>("__none__");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedTrip = useMemo(() => trips.find((tr) => tr.id === tripId) || null, [trips, tripId]);
  const days = useMemo(() => dayRange(selectedTrip?.departure_date ?? null, selectedTrip?.return_date ?? null), [selectedTrip]);

  // Auto-pick the most recent trip when dialog opens
  useEffect(() => {
    if (!open) return;
    if (!tripId && trips.length > 0) setTripId(trips[0].id);
    setNote("");
    setDay("__none__");
  }, [open, trips, tripId]);

  const fmtDay = (d: string) => {
    try {
      return new Date(d + "T00:00:00").toLocaleDateString(i18n.language, {
        weekday: "short", day: "numeric", month: "short",
      });
    } catch { return d; }
  };

  const handleAdd = async () => {
    if (!user || !place || !selectedTrip) return;
    setSubmitting(true);
    const cat = categoryByKey(place.category);
    const { error } = await supabase.from("trip_activities").insert({
      trip_id: selectedTrip.id,
      user_id: user.id,
      source: "discover",
      title: place.name,
      description: note.trim() || place.description || null,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      day_date: day !== "__none__" ? day : null,
      status: "todo",
      position: 0,
      metadata: {
        place_id: place.id,
        emoji: cat?.emoji ?? "📍",
        address: place.address ?? null,
        image_url: place.image_url ?? null,
        from: "discover",
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(t("discoverComp.itinerary.errAdd"));
      return;
    }
    toast.success(t("discoverComp.itinerary.added", { trip: selectedTrip.title || selectedTrip.destination || t("discoverComp.itinerary.trip") }));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarPlus className="h-5 w-5 text-primary" />{t("discoverComp.itinerary.title")}</DialogTitle>
          <DialogDescription>
            {place ? t("discoverComp.itinerary.subtitle", { name: place.name }) : ""}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {t("discoverComp.itinerary.loginRequired")}
          </p>
        ) : tripsLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : trips.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {t("discoverComp.itinerary.noTrip")}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("discoverComp.itinerary.trip")}</Label>
              <Select value={tripId} onValueChange={(v) => { setTripId(v); setDay("__none__"); }}>
                <SelectTrigger><SelectValue placeholder={t("discoverComp.itinerary.pickTrip")} /></SelectTrigger>
                <SelectContent>
                  {trips.map((tr) => (
                    <SelectItem key={tr.id} value={tr.id}>
                      {tr.title || tr.destination || t("discoverComp.itinerary.untitled")}
                      {tr.destination && tr.title ? ` · ${tr.destination}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("discoverComp.itinerary.day")}</Label>
              <Select value={day} onValueChange={setDay} disabled={days.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={t("discoverComp.itinerary.dayPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("discoverComp.itinerary.dayNone")}</SelectItem>
                  {days.map((d) => (
                    <SelectItem key={d} value={d}>{fmtDay(d)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {days.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("discoverComp.itinerary.noDates")}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t("discoverComp.itinerary.noteLabel")}</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                placeholder={t("discoverComp.itinerary.notePlaceholder")}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t("discoverComp.itinerary.cancel")}</Button>
          <Button onClick={handleAdd} disabled={!user || !selectedTrip || submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
            {t("discoverComp.itinerary.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToItineraryDialog;
