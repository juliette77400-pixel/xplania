import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BookOpen, Camera, MapPin, Calendar } from "lucide-react";
import { useJournalCover } from "@/hooks/useJournalCover";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Trip {
  id: string;
  destination: string | null;
  arrival_city: string | null;
  departure_date: string | null;
  return_date: string | null;
}

interface Props {
  trip: Trip;
  onOpen: () => void;
  index?: number;
}

const NotebookCard = ({ trip, onOpen, index = 0 }: Props) => {
  const { t } = useTranslation();
  const { cover } = useJournalCover(trip.id, trip.destination);
  const [stats, setStats] = useState<{ pages: number; photos: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: j } = await supabase
        .from("journals")
        .select("id")
        .eq("trip_id", trip.id)
        .maybeSingle();
      if (!j || cancelled) return;
      const [{ count: pages }, { count: photos }] = await Promise.all([
        supabase.from("journal_days").select("id", { count: "exact", head: true }).eq("journal_id", j.id),
        supabase.from("journal_blocks").select("id", { count: "exact", head: true }).eq("journal_id", j.id).eq("type", "photo"),
      ]);
      if (!cancelled) setStats({ pages: pages || 0, photos: photos || 0 });
    })();
    return () => { cancelled = true; };
  }, [trip.id]);

  const title = trip.destination
    ? t("notebook.titleFor", { dest: trip.destination, defaultValue: `Carnet — ${trip.destination}` })
    : t("common2.noDestination");

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl text-left bg-card border border-border shadow-md hover:shadow-xl transition-all"
    >
      {/* Cover */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={trip.destination || ""}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] uppercase tracking-wider font-semibold text-foreground">
          <BookOpen className="w-3 h-3" /> {t("carnets.kicker")}
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-bold text-lg leading-tight drop-shadow-md line-clamp-2">{title}</h3>
          {trip.departure_date && (
            <p className="text-xs mt-1 opacity-90 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {trip.departure_date}{trip.return_date && ` → ${trip.return_date}`}
            </p>
          )}
        </div>
      </div>
      {/* Footer stats */}
      <div className="px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {stats?.pages ?? 0} {t("notebook.pages")}</span>
          <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> {stats?.photos ?? 0}</span>
        </div>
        {trip.arrival_city && (
          <span className="flex items-center gap-1 truncate max-w-[40%]"><MapPin className="w-3 h-3" /> {trip.arrival_city}</span>
        )}
      </div>
    </motion.button>
  );
};

export default NotebookCard;
