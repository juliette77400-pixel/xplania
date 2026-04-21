import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, MapPin } from "lucide-react";
import type { ExploreNode } from "@/hooks/useExplore";
import { TYPE_COLORS } from "@/lib/explore-badges";
import { useTranslation } from "react-i18next";

interface Props { nodes: ExploreNode[]; }

const ReplayMode = ({ nodes }: Props) => {
  const { t, i18n } = useTranslation();
  const formatDate = (s?: string | null) => {
    if (!s) return "";
    try { return new Date(s).toLocaleDateString(i18n.language.startsWith("fr") ? "fr-FR" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  const visitedSorted = useMemo(
    () => nodes
      .filter((n) => n.status === "visited" && n.visited_at)
      .sort((a, b) => new Date(a.visited_at!).getTime() - new Date(b.visited_at!).getTime()),
    [nodes],
  );

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const total = visitedSorted.length;

  useEffect(() => {
    if (!playing || step >= total) return;
    const tm = setTimeout(() => setStep((s) => Math.min(s + 1, total)), 1100);
    return () => clearTimeout(tm);
  }, [playing, step, total]);

  useEffect(() => { if (step >= total) setPlaying(false); }, [step, total]);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-10 text-center">
        <MapPin className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
        <p className="text-sm text-muted-foreground">{t("x2.noVisited")}</p>
      </div>
    );
  }

  const progressPct = total <= 1 ? 100 : (step / total) * 100;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-gradient-to-b from-card/60 to-card/30 p-6 md:p-8 overflow-x-auto">
        <div className="min-w-[640px] relative py-10">
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-2 rounded-full bg-muted/40" />
          <motion.div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_18px_hsl(var(--primary)/0.6)]"
            initial={{ width: 0 }}
            animate={{ width: `calc((100% - 48px) * ${progressPct / 100})` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />

          <div className="relative flex items-center justify-between gap-2 px-6">
            {visitedSorted.map((n, i) => {
              const reached = i < step;
              const current = i === step - 1;
              const color = TYPE_COLORS[n.type] || "hsl(190 90% 60%)";
              return (
                <div key={n.id} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <div className={`text-[10px] uppercase tracking-wide ${reached ? "text-foreground" : "text-muted-foreground/60"} h-4`}>
                    {formatDate(n.visited_at)}
                  </div>
                  <motion.div
                    initial={false}
                    animate={{
                      scale: current ? 1.4 : reached ? 1.05 : 0.85,
                      opacity: reached ? 1 : 0.4,
                    }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                    className="relative z-10 rounded-full border-2 border-background flex items-center justify-center"
                    style={{
                      width: 22,
                      height: 22,
                      background: reached ? color : "hsl(220 15% 25%)",
                      boxShadow: current ? `0 0 24px ${color}` : reached ? `0 0 8px ${color}` : "none",
                    }}
                  >
                    {current && (
                      <motion.span
                        className="absolute inset-0 rounded-full"
                        initial={{ boxShadow: `0 0 0 0 ${color}` }}
                        animate={{ boxShadow: [`0 0 0 0 ${color}`, `0 0 0 14px transparent`] }}
                        transition={{ repeat: Infinity, duration: 1.6 }}
                      />
                    )}
                  </motion.div>
                  <div className={`text-[11px] font-medium text-center max-w-[110px] truncate ${reached ? "text-foreground" : "text-muted-foreground/70"}`}>
                    {n.name}
                  </div>
                  <div className="text-[9px] uppercase text-muted-foreground/60 tracking-wide">{n.type}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {step > 0 && step <= total && (
        <motion.div
          key={visitedSorted[step - 1]?.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/30 bg-primary/5 p-4"
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: TYPE_COLORS[visitedSorted[step - 1].type] || "hsl(190 90% 60%)" }}
            >
              📍
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground truncate">{visitedSorted[step - 1].name}</h4>
              <p className="text-xs text-muted-foreground">
                {step}/{total} · +{visitedSorted[step - 1].points} pts · {formatDate(visitedSorted[step - 1].visited_at)}
              </p>
              {visitedSorted[step - 1].description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{visitedSorted[step - 1].description}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-3 px-2">
        <Button size="icon" variant="outline" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button size="icon" onClick={() => { if (step >= total) setStep(0); setPlaying((p) => !p); }}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Slider
          value={[step]}
          min={0}
          max={total}
          step={1}
          onValueChange={([v]) => { setStep(v); setPlaying(false); }}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">{step}/{total}</span>
      </div>
    </div>
  );
};

export default ReplayMode;
