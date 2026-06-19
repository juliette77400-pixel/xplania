import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props {
  loading?: boolean;
  onSubmit: (input: { mood: MoodKey; energy_level?: number; free_input?: string }) => void | Promise<void>;
}

/**
 * Visual radial mood wheel — alternative to the classic <MoodSelector />.
 * Click a slice to pick a mood, then adjust energy and confirm.
 */
const MoodWheel = ({ loading, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<MoodKey | null>(null);
  const [energy, setEnergy] = useState<number>(50);

  const size = 280;
  const r = size / 2;
  const innerR = 70;
  const n = MOODS.length;
  const slice = (Math.PI * 2) / n;

  const polar = (radius: number, angle: number) => ({
    x: r + radius * Math.cos(angle),
    y: r + radius * Math.sin(angle),
  });

  const slicePath = (i: number) => {
    const a0 = -Math.PI / 2 + i * slice;
    const a1 = a0 + slice;
    const p0 = polar(innerR, a0);
    const p1 = polar(r - 4, a0);
    const p2 = polar(r - 4, a1);
    const p3 = polar(innerR, a1);
    return `M${p0.x} ${p0.y} L${p1.x} ${p1.y} A${r - 4} ${r - 4} 0 0 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${innerR} ${innerR} 0 0 0 ${p0.x} ${p0.y} Z`;
  };

  const labelPos = (i: number) => polar((r + innerR) / 2, -Math.PI / 2 + i * slice + slice / 2);

  const sliceFill = [
    "hsl(var(--primary) / 0.18)",
    "hsl(var(--secondary) / 0.18)",
    "hsl(var(--accent) / 0.18)",
    "hsl(var(--primary) / 0.10)",
    "hsl(var(--secondary) / 0.10)",
    "hsl(var(--accent) / 0.10)",
    "hsl(var(--primary) / 0.22)",
  ];

  return (
    <section aria-label={t("moodComp.wheel.aria")} className="rounded-2xl border border-border bg-card/40 p-4 md:p-6 space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-base md:text-lg font-semibold text-foreground">{t("moodComp.wheel.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("moodComp.wheel.subtitle")}</p>
      </div>

      <div className="flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={t("moodComp.wheel.aria")}>
          {MOODS.map((m, i) => {
            const isActive = selected === m.key;
            const pos = labelPos(i);
            return (
              <g key={m.key} className="cursor-pointer" onClick={() => setSelected(m.key)}>
                <path
                  d={slicePath(i)}
                  fill={sliceFill[i % sliceFill.length]}
                  stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}
                  strokeWidth={isActive ? 2.5 : 1}
                  className="transition-all duration-200 hover:opacity-90"
                  style={{ filter: isActive ? "drop-shadow(0 0 12px hsl(var(--primary) / 0.5))" : undefined }}
                />
                <text
                  x={pos.x}
                  y={pos.y - 4}
                  textAnchor="middle"
                  fontSize="22"
                  pointerEvents="none"
                >
                  {m.emoji}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="hsl(var(--foreground))"
                  pointerEvents="none"
                  className="font-medium"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
          <circle cx={r} cy={r} r={innerR - 2} fill="hsl(var(--background))" stroke="hsl(var(--border))" />
          <text x={r} y={r - 4} textAnchor="middle" fontSize="28">
            {selected ? MOODS.find((m) => m.key === selected)?.emoji : "🎭"}
          </text>
          <text x={r} y={r + 18} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
            {selected ? MOODS.find((m) => m.key === selected)?.label : t("moodComp.wheel.pick")}
          </text>
        </svg>
      </div>

      {selected && (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("moodComp.wheel.energy")}</span>
              <span className="font-medium text-foreground">{energy}%</span>
            </div>
            <Slider value={[energy]} onValueChange={(v) => setEnergy(v[0])} min={0} max={100} step={5} />
          </div>
          <Button
            className="w-full"
            disabled={loading}
            onClick={() => onSubmit({ mood: selected, energy_level: energy })}
          >
            {loading ? t("moodComp.wheel.loading") : t("moodComp.wheel.generate")}
          </Button>
        </div>
      )}
    </section>
  );
};

export default MoodWheel;
