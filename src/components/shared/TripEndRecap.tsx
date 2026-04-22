// ✨ NEW — Écran de fin de voyage : stats + badges + CTA partage
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Trophy, MapPin, Camera, Sparkles, Share2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Trip } from "@/hooks/useTrips";

interface Props {
  trip: Trip;
  onShare?: () => void;
}

interface Stats {
  days: number;
  blocks: number;
  photos: number;
  badges: number;
  checkins: number;
  km: number;
}

const TripEndRecap = ({ trip, onShare }: Props) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: journal }, { data: tracking }] = await Promise.all([
        supabase.from("journals").select("id").eq("trip_id", trip.id).maybeSingle(),
        supabase.from("trip_tracking").select("total_distance_km").eq("trip_id", trip.id).maybeSingle(),
      ]);
      let days = 0, blocks = 0, photos = 0, badges = 0, checkins = 0;
      if (journal?.id) {
        const [{ count: dCount }, { data: bRows }, { count: bCount }] = await Promise.all([
          supabase.from("journal_days").select("id", { count: "exact", head: true }).eq("journal_id", journal.id),
          supabase.from("journal_blocks").select("type").eq("journal_id", journal.id),
          supabase.from("journal_badges").select("id", { count: "exact", head: true }).eq("journal_id", journal.id),
        ]);
        days = dCount || 0;
        blocks = bRows?.length || 0;
        photos = bRows?.filter((r: any) => r.type === "photo").length || 0;
        badges = bCount || 0;
      }
      const { count: cCount } = await supabase
        .from("trip_checkins")
        .select("id", { count: "exact", head: true })
        .eq("trip_id", trip.id);
      checkins = cCount || 0;

      if (!cancelled) {
        setStats({
          days: days || trip.duration || 0,
          blocks,
          photos,
          badges,
          checkins,
          km: Number(tracking?.total_distance_km || 0),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.id, trip.duration]);

  const isFr = i18n.language.startsWith("fr");
  const dateLocale = isFr ? "fr-FR" : "en-US";
  const tiles = [
    { icon: Calendar, label: t("tripRecap.days"), value: stats?.days ?? "—", color: "from-cyan-500/20 to-blue-500/20" },
    { icon: MapPin, label: t("tripRecap.checkins"), value: stats?.checkins ?? "—", color: "from-emerald-500/20 to-teal-500/20" },
    { icon: Camera, label: t("tripRecap.photos"), value: stats?.photos ?? "—", color: "from-pink-500/20 to-purple-500/20" },
    { icon: Sparkles, label: t("tripRecap.memories"), value: stats?.blocks ?? "—", color: "from-amber-500/20 to-orange-500/20" },
    { icon: Trophy, label: t("tripRecap.badges"), value: stats?.badges ?? "—", color: "from-yellow-500/20 to-amber-500/20" },
    { icon: MapPin, label: t("tripRecap.km"), value: stats?.km ? stats.km.toFixed(1) : "—", color: "from-violet-500/20 to-fuchsia-500/20" },
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-card to-accent/10 border-primary/30 space-y-5">
      <div className="text-center space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{t("tripRecap.kicker")}</p>
        <h2 className="text-xl sm:text-2xl font-bold gradient-text">
          {t("tripRecap.title", { destination: trip.destination || trip.title || "" })}
        </h2>
        {trip.return_date && (
          <p className="text-xs text-muted-foreground">
            {t("tripRecap.endedOn")} {new Date(trip.return_date).toLocaleDateString(dateLocale)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl p-3 bg-gradient-to-br ${tile.color} border border-border`}
          >
            <tile.icon className="w-4 h-4 text-primary mb-1" />
            <div className="text-xl font-bold">{tile.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{tile.label}</div>
          </motion.div>
        ))}
      </div>

      {onShare && (
        <Button onClick={onShare} className="w-full gradient-button">
          <Share2 className="w-4 h-4 mr-2" /> {t("tripRecap.shareCta")}
        </Button>
      )}
    </Card>
  );
};

export default TripEndRecap;
