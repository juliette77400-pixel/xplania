import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTrips } from "@/hooks/useTrips";
import { moodByKey } from "@/lib/moods";
import { toast } from "sonner";

interface Props {
  mood: string | null;
  topPlace?: { name: string; address?: string | null } | null;
  placesCount: number;
}

/**
 * Pre-fills and inserts a "mood" journal_blocks entry into a chosen trip's
 * journal (today's day, or first day if today is outside the trip).
 */
const AddToCarnetButton = ({ mood, topPlace, placesCount }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { trips, loading: tripsLoading } = useTrips();
  const m = mood ? moodByKey(mood) : null;
  const [open, setOpen] = useState(false);
  const [tripId, setTripId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trips.length && !tripId) setTripId(trips[0].id);
  }, [trips, tripId]);

  useEffect(() => {
    if (!open) return;
    const base = `${m?.emoji ?? "🎭"} ${t("moodComp.carnet.prefillIntro", {
      mood: m?.label ?? mood ?? "",
    })}`;
    const place = topPlace?.name ? `\n📍 ${topPlace.name}` : "";
    setNote(`${base}${place}`);
  }, [open, mood, topPlace?.name]);

  const handleSave = async () => {
    if (!user || !tripId || !mood) return;
    setSaving(true);
    try {
      // Find / create journal for this trip
      let { data: j } = await supabase
        .from("journals")
        .select("id")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!j) {
        const { data: trip } = await supabase
          .from("trips")
          .select("destination")
          .eq("id", tripId)
          .maybeSingle();
        const { data: created, error: jErr } = await supabase
          .from("journals")
          .insert({
            trip_id: tripId,
            user_id: user.id,
            title: trip?.destination ? `Carnet — ${trip.destination}` : "Mon carnet",
          })
          .select("id")
          .single();
        if (jErr) throw jErr;
        j = created;
      }

      const today = new Date().toISOString().slice(0, 10);
      let { data: day } = await supabase
        .from("journal_days")
        .select("id")
        .eq("journal_id", j!.id)
        .eq("date", today)
        .maybeSingle();

      if (!day) {
        // Fall back to first existing day, or create one for today
        const { data: anyDay } = await supabase
          .from("journal_days")
          .select("id")
          .eq("journal_id", j!.id)
          .order("date", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (anyDay) {
          day = anyDay;
        } else {
          const { data: created, error: dErr } = await supabase
            .from("journal_days")
            .insert({ journal_id: j!.id, user_id: user.id, date: today, position: 0 })
            .select("id")
            .single();
          if (dErr) throw dErr;
          day = created;
        }
      }

      // Compute next position
      const { count } = await supabase
        .from("journal_blocks")
        .select("*", { count: "exact", head: true })
        .eq("day_id", day!.id);

      const { error: bErr } = await supabase.from("journal_blocks").insert({
        journal_id: j!.id,
        day_id: day!.id,
        user_id: user.id,
        type: "mood",
        position: count ?? 0,
        content: {
          mood,
          mood_label: m?.label ?? null,
          mood_emoji: m?.emoji ?? null,
          note,
          top_place: topPlace ?? null,
          places_count: placesCount,
          source: "mood_explorer",
        },
      });
      if (bErr) throw bErr;

      toast.success(t("moodComp.carnet.success"));
      setOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(t("moodComp.carnet.error"));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!mood}
      >
        <BookOpen className="w-4 h-4 mr-2" /> {t("moodComp.carnet.button")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> {t("moodComp.carnet.dialogTitle")}
            </DialogTitle>
            <DialogDescription>{t("moodComp.carnet.dialogDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("moodComp.carnet.pickTrip")}</label>
              {tripsLoading ? (
                <div className="text-xs text-muted-foreground">…</div>
              ) : trips.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  {t("moodComp.carnet.noTrips")}
                </div>
              ) : (
                <Select value={tripId} onValueChange={setTripId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((tr) => (
                      <SelectItem key={tr.id} value={tr.id}>
                        {tr.title || tr.destination || "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("moodComp.carnet.note")}</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                {t("moodComp.carnet.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving || !tripId}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("moodComp.carnet.saving")}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t("moodComp.carnet.save")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddToCarnetButton;
