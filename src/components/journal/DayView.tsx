import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, FileText, Camera, MapPin, Smile, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import BlockCard from "./BlockCard";
import type { JournalDay } from "@/hooks/useJournal";
import { formatDayLabel } from "@/lib/journal-utils";
import { Input } from "@/components/ui/input";
import { Cloud } from "lucide-react";

interface Props {
  day: JournalDay;
  journalId: string;
  destination?: string;
  onChanged: () => void;
}

const BLOCK_TYPES = [
  { type: "note", labelKey: "j2.blockNote", icon: FileText },
  { type: "photo", labelKey: "j2.blockPhoto", icon: Camera },
  { type: "location", labelKey: "j2.blockLocation", icon: MapPin },
  { type: "mood", labelKey: "j2.blockMood", icon: Smile },
  { type: "highlight", labelKey: "j2.blockHighlight", icon: Star },
] as const;

const DayView = ({ day, journalId, destination, onChanged }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [title, setTitle] = useState(day.title || "");

  const addBlock = async (type: string) => {
    if (!user) return;
    setShowMenu(false);
    const defaults: Record<string, any> = {
      note: { text: "" },
      photo: {},
      location: { name: "" },
      mood: { score: 3, emoji: "😐" },
      highlight: { text: "" },
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
        {day.weather && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Cloud className="w-3 h-3" />
            {(day.weather.condition || "")} {day.weather.temp ? `· ${day.weather.temp}°C` : ""}
          </div>
        )}
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
              className="absolute top-full mt-2 left-0 right-0 grid grid-cols-2 sm:grid-cols-5 gap-2 glass-card rounded-xl p-3 z-20"
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
    </div>
  );
};

export default DayView;
