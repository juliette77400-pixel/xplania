import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import MoodPlaceCard from "./MoodPlaceCard";
import type { MoodPlace } from "@/hooks/useMoodExplorer";

interface Props {
  places: MoodPlace[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (place: MoodPlace) => void;
  onOpenDetails?: (place: MoodPlace) => void;
}

const MoodFeed = ({ places, isFavorite, onToggleFavorite, onOpenDetails }: Props) => {
  const [index, setIndex] = useState(0);

  if (places.length === 0) return null;

  const next = () => setIndex((i) => Math.min(i + 1, places.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));
  const place = places[index];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>{index + 1} / {places.length}</span>
        <span>↕ swipe</span>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={place.id}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (info.offset.y < -80) next();
              else if (info.offset.y > 80) prev();
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.25 }}
          >
            <MoodPlaceCard
              place={place}
              isFavorite={isFavorite(place.id)}
              onToggleFavorite={() => onToggleFavorite(place)}
              onOpenDetails={onOpenDetails ? () => onOpenDetails(place) : undefined}
              fullscreen
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          <Button size="icon" variant="secondary" onClick={prev} disabled={index === 0} className="rounded-full backdrop-blur-md bg-background/60">
            <ChevronUp className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="secondary" onClick={next} disabled={index === places.length - 1} className="rounded-full backdrop-blur-md bg-background/60">
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoodFeed;
