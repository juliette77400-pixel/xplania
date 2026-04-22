// ✨ NEW — Compte à rebours avant départ
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

interface Props {
  departureDate?: string | null;
  returnDate?: string | null;
  compact?: boolean;
}

function diffParts(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return { days, hours, minutes };
}

const TripCountdown = ({ departureDate, returnDate, compact }: Props) => {
  const { t } = useTranslation();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!departureDate) return null;
  const dep = new Date(departureDate);
  const ret = returnDate ? new Date(returnDate) : null;
  const now = new Date();

  // En cours
  if (ret && now >= dep && now <= ret) {
    const remaining = diffParts(ret);
    return (
      <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"} text-emerald-400`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-medium">
          {t("countdown.inProgress")} · {remaining ? t("countdown.daysLeft", { n: remaining.days }) : t("countdown.endingSoon")}
        </span>
      </div>
    );
  }

  // Terminé
  if (ret && now > ret) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"} text-muted-foreground`}>
        <Clock className="w-3.5 h-3.5" />
        {t("countdown.finished")}
      </div>
    );
  }

  const parts = diffParts(dep);
  if (!parts) return null;

  return (
    <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"} text-primary`}>
      <Clock className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
      <span className="font-semibold">
        {parts.days > 0
          ? t("countdown.dh", { d: parts.days, h: parts.hours })
          : parts.hours > 0
          ? t("countdown.hm", { h: parts.hours, m: parts.minutes })
          : t("countdown.minutes", { m: parts.minutes })}
      </span>
      <span className="text-muted-foreground">{t("countdown.beforeDeparture")}</span>
    </div>
  );
};

export default TripCountdown;
