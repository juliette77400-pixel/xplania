import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MOOD_AMBIENCE } from "@/lib/mood-badges";
import { type MoodKey, moodByKey } from "@/lib/moods";

interface Props {
  mood: string | null;
}

const MoodAmbience = ({ mood }: Props) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(40);
  const [muted, setMuted] = useState(false);

  const ambience = mood ? MOOD_AMBIENCE[mood as MoodKey] : undefined;
  const moodDef = mood ? moodByKey(mood) : undefined;
  const moodLabel = moodDef ? t(`moodComp.moods.${moodDef.key}.label`, { defaultValue: moodDef.label }) : "";

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, [mood]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume / 100;
    }
  }, [volume, muted]);

  const toggle = async () => {
    if (!ambience || !audioRef.current) return;
    try {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.volume = muted ? 0 : volume / 100;
        await audioRef.current.play();
        setPlaying(true);
      }
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  };

  if (!mood || !ambience) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5 backdrop-blur-sm"
        >
          <Music className={`w-4 h-4 ${playing ? "text-primary animate-pulse" : ""}`} />
          <span className="hidden sm:inline text-xs">{ambience.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="end">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{moodDef?.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{ambience.label}</div>
            <div className="text-[11px] text-muted-foreground">{t("moodComp.ambience.moodAmbience", { mood: moodLabel })}</div>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={ambience.url}
          loop
          preload="none"
          onEnded={() => setPlaying(false)}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={toggle} className="flex-1">
            {playing ? <><Pause className="w-4 h-4 mr-1" /> {t("moodComp.ambience.pause")}</> : <><Play className="w-4 h-4 mr-1" /> {t("moodComp.ambience.play")}</>}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setMuted((m) => !m)}>
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
        <Slider
          value={[volume]}
          onValueChange={(v) => setVolume(v[0])}
          max={100}
          step={5}
          disabled={muted}
        />
        <p className="text-[10px] text-muted-foreground text-center">
          {t("moodComp.ambience.enableSound")}
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default MoodAmbience;
