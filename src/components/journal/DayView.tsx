import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, FileText, Camera, MapPin, Smile, Star, Mic, CloudSun, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import BlockCard from "./BlockCard";
import TripDocumentsManager from "@/components/shared/TripDocumentsManager";
import type { JournalDay } from "@/hooks/useJournal";
import { formatDayLabel } from "@/lib/journal-utils";
import { pingStreakAction } from "@/lib/streak";
import { Input } from "@/components/ui/input";
import { Cloud } from "lucide-react";
import { toast } from "sonner";

interface Props {
  day: JournalDay;
  journalId: string;
  destination?: string;
  tripId?: string;
  allDays?: { id: string; date: string; title?: string | null }[];
  onChanged: () => void;
}

const BLOCK_TYPES = [
  { type: "note", labelKey: "j2.blockNote", icon: FileText },
  { type: "photo", labelKey: "j2.blockPhoto", icon: Camera },
  { type: "location", labelKey: "j2.blockLocation", icon: MapPin },
  { type: "mood", labelKey: "j2.blockMood", icon: Smile },
  { type: "highlight", labelKey: "j2.blockHighlight", icon: Star },
  { type: "audio", labelKey: "j2.blockAudio", icon: Mic },
] as const;

const DayView = ({ day, journalId, destination, tripId, allDays, onChanged }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [title, setTitle] = useState(day.title || "");
  const [weatherLoading, setWeatherLoading] = useState(false);

  const fetchWeather = async () => {
    if (!navigator.geolocation) { toast.error(t("j2.geoUnavailable")); return; }
    setWeatherLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
      const { data, error } = await supabase.functions.invoke("weather-now", {
        body: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      });
      if (error) throw error;
      const w = data || {};
      await supabase.from("journal_days").update({ weather: w }).eq("id", day.id);
      toast.success(t("j2.weatherSaved"));
      onChanged();
    } catch (e: any) {
      toast.error(t("j2.weatherFail"));
    } finally { setWeatherLoading(false); }
  };

  const fillLocation = async () => {
    if (!navigator.geolocation || !user) { toast.error(t("j2.geoUnavailable")); return; }
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
      await supabase.from("journal_blocks").insert({
        day_id: day.id,
        journal_id: journalId,
        user_id: user.id,
        type: "location",
        content: { name: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, lat: pos.coords.latitude, lng: pos.coords.longitude },
        position: day.blocks.length,
      });
      pingStreakAction("journal:location");
      onChanged();
    } catch { toast.error(t("j2.geoUnavailable")); }
  };

  const addBlock = async (type: string) => {
    if (!user) return;
    setShowMenu(false);
    const defaults: Record<string, any> = {
      note: { text: "" },
      photo: {},
      location: { name: "" },
      mood: { score: 3, emoji: "😐" },
      highlight: { text: "" },
      audio: {},
    };
    await supabase.from("journal_blocks").insert({
      day_id: day.id,
      journal_id: journalId,
      user_id: user.id,
      type,
      content: defaults[type] || {},
      position: day.blocks.length,
    });
    // ✨ NEW (gamif) — toute création de bloc carnet alimente le streak
    pingStreakAction(`journal:${type}`);
    onChanged();
  };

  const saveTitle = async () => {
    if (title === (day.title || "")) return;
    await supabase.from("journal_days").update({ title }).eq("id", day.id);
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-primary font-semibold">{formatDayLabel(day.date)}</p>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          placeholder={t("j2.giveDayTitle")}
          className="mt-1 text-2xl font-bold border-0 bg-transparent px-0 focus-visible:ring-0 text-foreground"
        />
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {day.weather ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Cloud className="w-3 h-3" />
              {(day.weather.condition || "")} {day.weather.temp ? `· ${day.weather.temp}°C` : ""}
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={fetchWeather} disabled={weatherLoading}>
              {weatherLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudSun className="w-3 h-3" />}
              {t("j2.weatherBtn")}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={fillLocation}>
            <MapPin className="w-3 h-3" /> {t("j2.locationBtn")}
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence>
          {day.blocks.map((b) => (
            <BlockCard key={b.id} block={b} journalId={journalId} destination={destination} onChanged={onChanged} />
          ))}
        </AnimatePresence>
      </div>

      <div className="relative">
        <Button onClick={() => setShowMenu(!showMenu)} variant="outline" className="w-full border-dashed">
          <Plus className="w-4 h-4" /> {t("j2.addMemory")}
        </Button>
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full mt-2 left-0 right-0 grid grid-cols-2 sm:grid-cols-6 gap-2 glass-card rounded-xl p-3 z-20"
            >
              {BLOCK_TYPES.map((b) => (
                <button
                  key={b.type}
                  onClick={() => addBlock(b.type)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-primary/10 transition"
                >
                  <b.icon className="w-5 h-5 text-primary" />
                  <span className="text-xs text-foreground">{t(b.labelKey)}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ✨ Documents épinglés à cette page du carnet */}
      {tripId && (
        <TripDocumentsManager tripId={tripId} dayId={day.id} days={allDays} compact />
      )}
    </div>
  );
};

export default DayView;
