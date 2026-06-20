import { useTranslation } from "react-i18next";
import { MapPin, Flag, Navigation } from "lucide-react";

interface Stage {
  id: string;
  title: string;
  status?: string | null;
}

interface Props {
  destination?: string;
  progressKm: number;
  totalKm?: number;
  stages?: Stage[];
  /** Soft height of the SVG illustration. */
  height?: number;
}

/**
 * Visual placeholder map — pure SVG, no external tiles, no GPS dependency.
 * Replaces the unstable Leaflet map. Used to give users a visual anchor of
 * their progress without risking a crash.
 */
const FakeMapView = ({ destination, progressKm, totalKm, stages = [], height = 320 }: Props) => {
  const { t } = useTranslation();
  const safeTotal = totalKm && totalKm > 0 ? totalKm : Math.max(progressKm, 1);
  const ratio = Math.min(1, Math.max(0, progressKm / safeTotal));
  const remaining = Math.max(0, safeTotal - progressKm);

  // Distribute up to 5 stage markers along the dashed path
  const limited = stages.slice(0, 5);
  const stagePositions = limited.map((_, i) => (i + 1) / (limited.length + 1));

  return (
    <div className="relative rounded-2xl border border-border overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <svg
        viewBox="0 0 800 320"
        preserveAspectRatio="none"
        style={{ width: "100%", height }}
        role="img"
        aria-label={t("suiviTrip.fakeMap.alt")}
      >
        {/* Soft terrain blobs */}
        <defs>
          <radialGradient id="land1" cx="20%" cy="30%" r="40%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="land2" cx="80%" cy="70%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.20" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="320" fill="url(#land1)" />
        <rect width="800" height="320" fill="url(#land2)" />

        {/* Subtle grid */}
        <g stroke="hsl(var(--border))" strokeOpacity="0.35" strokeWidth="1">
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`v${i}`} x1={(i + 1) * 100} y1="0" x2={(i + 1) * 100} y2="320" />
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={(i + 1) * 80} x2="800" y2={(i + 1) * 80} />
          ))}
        </g>

        {/* Curvy dashed route */}
        <path
          d="M 60 240 C 200 80, 320 320, 460 180 S 700 60, 740 120"
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeOpacity="0.4"
          strokeWidth="3"
          strokeDasharray="8 8"
        />
        {/* Progress overlay */}
        <path
          d="M 60 240 C 200 80, 320 320, 460 180 S 700 60, 740 120"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${ratio} 1`}
        />

        {/* Stage markers along the path (approximated positions) */}
        {stagePositions.map((p, i) => {
          // Approximation of points along the cubic path
          const x = 60 + (740 - 60) * p;
          const y = 240 - Math.sin(p * Math.PI) * 120 + (p > 0.6 ? 20 : 0);
          const done = limited[i]?.status === "done" || limited[i]?.status === "visited";
          return (
            <g key={limited[i].id}>
              <circle
                cx={x}
                cy={y}
                r="7"
                fill={done ? "hsl(var(--primary))" : "hsl(var(--background))"}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>

      {/* Start pin */}
      <div className="absolute left-3 bottom-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 border border-border text-xs">
        <Flag className="w-3.5 h-3.5 text-primary" />
        <span>{t("suiviTrip.fakeMap.start")}</span>
      </div>
      {/* Destination pin */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 border border-border text-xs max-w-[55%] truncate">
        <MapPin className="w-3.5 h-3.5 text-accent" />
        <span className="truncate">{destination || t("suiviTrip.fakeMap.destination")}</span>
      </div>
      {/* Current marker */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs shadow-lg"
        style={{ left: `${10 + ratio * 80}%`, top: "50%" }}
      >
        <Navigation className="w-3.5 h-3.5" />
        <span>{progressKm.toFixed(1)} km</span>
      </div>

      {/* Km progress bar */}
      <div className="p-4 bg-background/70 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{t("suiviTrip.km.traveled", { km: progressKm.toFixed(1) })}</span>
          <span>{t("suiviTrip.km.remaining", { km: remaining.toFixed(1) })}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-2 italic">
          {t("suiviTrip.fakeMap.disclaimer")}
        </p>
      </div>
    </div>
  );
};

export default FakeMapView;
