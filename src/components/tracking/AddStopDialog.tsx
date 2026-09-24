import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MapPin, Search, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TripActivity } from "@/hooks/useTracking";
import { searchGooglePlaces, type GoogleSearchResult } from "@/lib/google-places";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tripId: string;
  activities: TripActivity[];
  near: { lat: number; lng: number } | null;
  onAdded: () => void;
}

/** Search a real place (Google Maps) and insert it as a trip stop on a chosen day. */
const AddStopDialog = ({ open, onOpenChange, tripId, activities, near, onAdded }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GoogleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [day, setDay] = useState("__none__");
  const [saving, setSaving] = useState<string | null>(null);
  const reqId = useRef(0);

  const days = useMemo(() => Array.from(new Set(activities.map((a) => a.day_date).filter(Boolean) as string[])).sort(), [activities]);

  useEffect(() => { if (open) { setQ(""); setResults([]); setDay(days[0] ?? "__none__"); } }, [open, days]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const id = ++reqId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchGooglePlaces(q.trim(), near);
        if (id === reqId.current) setResults(r);
      } catch {
        if (id === reqId.current) toast.error(t("gmaps.stop.searchError"));
      } finally { if (id === reqId.current) setLoading(false); }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [q, near, t]);

  const add = async (r: GoogleSearchResult) => {
    if (!user) return;
    setSaving(r.google_place_id);
    const dayDate = day === "__none__" ? null : day;
    const maxPos = Math.max(-1, ...activities.filter((a) => a.day_date === dayDate).map((a) => a.position));
    const { error } = await supabase.from("trip_activities").insert({
      trip_id: tripId, user_id: user.id, source: "manual", title: r.name, description: r.address,
      lat: r.lat, lng: r.lng, day_date: dayDate, position: maxPos + 1,
      metadata: { google_place_id: r.google_place_id, type: r.type },
    });
    setSaving(null);
    if (error) return toast.error(t("gmaps.stop.addError"));
    toast.success(t("gmaps.stop.added", { name: r.name }));
    onAdded();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("gmaps.stop.title")}</DialogTitle>
          <DialogDescription>{t("gmaps.stop.desc")}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("gmaps.stop.placeholder")} className="pl-9" />
        </div>
        {days.length > 0 && (
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("gmaps.stop.noDay")}</SelectItem>
              {days.map((d) => <SelectItem key={d} value={d}>{new Date(d + "T00:00:00").toLocaleDateString(t("ui2.TripTracker.dateLocale"), { weekday: "long", day: "numeric", month: "long" })}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {loading && <p className="flex items-center gap-2 p-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("gmaps.stop.searching")}</p>}
          {!loading && q.trim().length >= 2 && results.length === 0 && <p className="p-2 text-sm text-muted-foreground">{t("gmaps.stop.noResult")}</p>}
          {results.map((r) => (
            <button key={r.google_place_id} disabled={!!saving} onClick={() => add(r)}
              className="flex w-full items-start gap-2 rounded-lg p-2 text-left hover:bg-muted">
              {saving === r.google_place_id ? <Loader2 className="mt-0.5 h-4 w-4 animate-spin" /> : <MapPin className="mt-0.5 h-4 w-4 text-primary" />}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{r.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{r.address}</span>
              </span>
              {r.rating && <span className="flex items-center gap-0.5 text-xs"><Star className="h-3 w-3 fill-current text-accent" />{r.rating}</span>}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStopDialog;
