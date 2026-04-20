import { useRef } from "react";
import { toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ExploreNode, ExploreProgress, ExploreBadge } from "@/hooks/useExplore";

interface Props {
  destination?: string;
  progress: ExploreProgress | null;
  badges: ExploreBadge[];
  nodes: ExploreNode[];
}

const ShareGameCard = ({ destination, progress, badges, nodes }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  const download = async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#0a0a14" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `xplania-${destination || "voyage"}.png`;
      a.click();
      toast.success("Carte téléchargée 🎴");
    } catch {
      toast.error("Échec génération PNG");
    }
  };

  const visited = nodes.filter((n) => n.status === "visited").length;
  const topBadges = badges.slice(0, 4);

  return (
    <div className="space-y-3">
      <div ref={ref} className="rounded-2xl p-6 bg-gradient-to-br from-[hsl(280_60%_15%)] via-[hsl(220_50%_10%)] to-[hsl(190_60%_15%)] border border-primary/30 shadow-[0_0_60px_rgba(168,85,247,0.25)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary/80">Travel Map</p>
            <h3 className="text-2xl font-black text-white">{destination || "Mon voyage"}</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-primary/80">Score</p>
            <p className="text-3xl font-black text-white">{progress?.total_points || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold text-white">{visited}</p>
            <p className="text-[10px] text-white/60 uppercase">Lieux visités</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold text-white">{progress?.cities_completed || 0}</p>
            <p className="text-[10px] text-white/60 uppercase">Villes</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold text-white">{badges.length}</p>
            <p className="text-[10px] text-white/60 uppercase">Badges</p>
          </div>
        </div>

        {topBadges.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {topBadges.map((b) => (
              <div key={b.code} className="px-2 py-1 rounded-full bg-white/10 border border-white/20 text-xs text-white flex items-center gap-1">
                <span>{b.icon || "🏅"}</span> {b.name}
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-white/40 text-center pt-2 border-t border-white/10">xplania.lovable.app — Travel as a game</p>
      </div>

      <div className="flex gap-2">
        <Button onClick={download} className="flex-1"><Download className="w-4 h-4 mr-2" /> Télécharger PNG</Button>
        <Button variant="outline" onClick={async () => {
          if (navigator.share) {
            try { await navigator.share({ title: `Mon voyage ${destination}`, text: `${progress?.total_points || 0} pts sur Xplania ✨`, url: window.location.href }); }
            catch {}
          } else { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié"); }
        }}><Share2 className="w-4 h-4" /></Button>
      </div>
    </div>
  );
};

export default ShareGameCard;
