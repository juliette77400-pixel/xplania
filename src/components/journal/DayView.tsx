import { useState } from "react";
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
  onChanged: () => void;
}

const BLOCK_TYPES = [
  { type: "note", label: "Note", icon: FileText },
  { type: "photo", label: "Photo", icon: Camera },
  { type: "location", label: "Lieu", icon: MapPin },
  { type: "mood", label: "Humeur", icon: Smile },
  { type: "highlight", label: "Moment fort", icon: Star },
] as const;

const DayView = ({ day, journalId, onChanged }: Props) => {
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
          placeholder="Donne un titre à cette journée…"
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
            <BlockCard key={b.id} block={b} journalId={journalId} onChanged={onChanged} />
          ))}
        </AnimatePresence>
      </div>

      <div className="relative">
        <Button onClick={() => setShowMenu(!showMenu)} variant="outline" className="w-full border-dashed">
          <Plus className="w-4 h-4" /> Ajouter un souvenir
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
                  <span className="text-xs text-foreground">{b.label}</span>
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
