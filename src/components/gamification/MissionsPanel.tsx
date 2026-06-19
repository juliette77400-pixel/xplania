import { useTranslation } from "react-i18next";
import { Loader2, Sparkles, Trophy, CheckCircle2, Clock } from "lucide-react";
import { useGamMissions, type MissionRow } from "@/hooks/useGamMissions";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import BadgeClaimDialog from "./BadgeClaimDialog";
import type { BadgeWithClaim } from "@/hooks/useGamification";
import { useGamification } from "@/hooks/useGamification";

function timeLeft(endIso: string): string {
  const ms = new Date(endIso).getTime() - Date.now();
  if (ms <= 0) return "—";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  if (d > 0) return `${d}j ${h}h`;
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

const MissionsPanel = () => {
  const { i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const { missions, loading } = useGamMissions();
  const { badges } = useGamification();
  const [active, setActive] = useState<BadgeWithClaim | null>(null);

  const renderCard = (m: MissionRow) => {
    if (!m.badge) return null;
    const name = isFr ? m.badge.name_fr : m.badge.name_en;
    const desc = isFr ? m.badge.description_fr : m.badge.description_en;
    const cat = m.badge.category;
    const grad = cat ? `linear-gradient(135deg, ${cat.gradient_from}, ${cat.gradient_to})` : "linear-gradient(135deg,#057dcd,#9138c8)";
    const isMonthly = m.scope === "monthly";
    const openClaim = () => {
      const enriched = badges.find((b) => b.id === m.badge_id);
      if (enriched) setActive(enriched);
    };
    return (
      <div
        key={m.id}
        className={`rounded-2xl border p-5 text-left space-y-4 transition-colors ${m.done ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-card"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundImage: grad }}
          >
            {isMonthly ? <Trophy className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider border border-primary/40 text-primary rounded-full px-2 py-0.5">
              {isMonthly ? (isFr ? "Mensuel" : "Monthly") : (isFr ? "Hebdo" : "Weekly")}
            </span>
            <span className="text-xs font-bold border border-amber-500/40 text-amber-400 rounded-full px-2 py-0.5">
              +{m.badge.points} pts
            </span>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{desc}</p>
          {cat && (
            <p className="text-[10px] mt-2 uppercase tracking-wider text-muted-foreground">
              {isFr ? cat.name_fr : cat.name_en}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeLeft(m.end_date)}
          </span>
          {m.done ? (
            <span className="text-xs font-semibold text-emerald-500 inline-flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {isFr ? "Validé" : "Validated"}
            </span>
          ) : (
            <Button size="sm" onClick={openClaim}>{isFr ? "Tenter" : "Attempt"}</Button>
          )}
        </div>
      </div>
    );
  };

  const weekly = missions.filter((m) => m.scope === "weekly");
  const monthly = missions.filter((m) => m.scope === "monthly");

  return (
    <section>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isFr ? "Tes missions personnalisées" : "Your personalised missions"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isFr
            ? "Renouvelées chaque semaine et chaque mois, selon tes catégories préférées."
            : "Refreshed weekly and monthly, based on your favourite categories."}
        </p>
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-primary" /></div>
      ) : missions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {isFr
            ? "Aucune mission disponible — choisis tes catégories préférées dans ton profil pour en débloquer."
            : "No missions yet — pick your favourite categories in your profile to unlock some."}
        </div>
      ) : (
        <div className="space-y-6">
          {monthly.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {monthly.map(renderCard)}
            </div>
          )}
          {weekly.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {weekly.map(renderCard)}
            </div>
          )}
        </div>
      )}

      <BadgeClaimDialog badge={active} open={!!active} onOpenChange={(o) => !o && setActive(null)} />
    </section>
  );
};

export default MissionsPanel;
