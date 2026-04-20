import { Cloud, Clock, MapPin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moodByKey, timeOfDay } from "@/lib/moods";

interface Props {
  activeMood: string | null;
  weather: string | null;
  position: { lat: number; lng: number } | null;
  onReset: () => void;
}

const MoodHero = ({ activeMood, weather, position, onReset }: Props) => {
  const m = activeMood ? moodByKey(activeMood) : null;
  const tod = timeOfDay();

  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background backdrop-blur-sm p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-primary/80 font-semibold">Mood Explorer</p>
          {m ? (
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span className="text-3xl">{m.emoji}</span> {m.label}
            </h1>
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold">Trouve ta vibe du moment</h1>
          )}
          <p className="text-sm text-muted-foreground">
            {m ? m.description : "Une émotion → un lieu parfait."}
          </p>
        </div>

        {activeMood && (
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> Changer
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-4">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {tod}</span>
        {weather && <span className="flex items-center gap-1"><Cloud className="w-3 h-3" /> {weather}</span>}
        {position && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {position.lat.toFixed(2)}, {position.lng.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};

export default MoodHero;
