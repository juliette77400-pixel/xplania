import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlaceCard from "./PlaceCard";
import type { Place } from "@/hooks/useDiscover";

interface Props {
  title: string;
  emoji: string;
  places: Place[];
  onSelect: (p: Place) => void;
  isSaved?: (id: string) => boolean;
  onToggleSave?: (p: Place) => void;
}

const PlaceCarousel = ({ title, emoji, places, onSelect, isSaved, onToggleSave }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  if (places.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <span>{emoji}</span>{title}
          <span className="text-xs font-normal text-muted-foreground">({places.length})</span>
        </h2>
        <div className="hidden gap-1 md:flex">
          <Button size="icon" variant="ghost" onClick={() => scroll(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => scroll(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scroll-smooth snap-x">
        {places.map((p) => (
          <div key={p.id} className="snap-start">
            <PlaceCard place={p} onClick={() => onSelect(p)} saved={isSaved?.(p.id)} onToggleSave={onToggleSave ? () => onToggleSave(p) : undefined} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PlaceCarousel;
