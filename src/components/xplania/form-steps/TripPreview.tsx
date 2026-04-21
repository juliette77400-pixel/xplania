import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, CalendarDays, Wallet, Users, Plane, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDestinationImage } from "@/hooks/useDestinationImage";
import type { TravelFormData } from "@/types/travel";

interface Props {
  data: TravelFormData;
  onResume: () => void;
}

const Field = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate">{value || "—"}</p>
    </div>
  </div>
);

const TripPreview = ({ data, onResume }: Props) => {
  const { t } = useTranslation();
  const days = data.duration ? parseInt(data.duration) || 0 : 0;
  const perDay = days > 0 && data.totalBudget > 0 ? Math.round(data.totalBudget / days) : 0;
  const heroSrc = useDestinationImage(data.destination || "voyage", 1200, 600);

  const tOpt = (group: string, value: string) => (value ? t(`travelForm.options.${group}.${value}`, { defaultValue: value }) : "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="relative h-48 sm:h-60 rounded-2xl overflow-hidden bg-muted">
        <img
          src={heroSrc}
          alt={data.destination || ""}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">{t("travelForm.preview.kicker")}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            {data.destination || t("travelForm.preview.destinationFallback")}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field icon={<MapPin className="w-4 h-4 text-primary" />} label={t("travelForm.preview.destination")} value={data.destination} />
        <Field icon={<Plane className="w-4 h-4 text-primary" />} label={t("travelForm.preview.departure")} value={data.departureLocation} />
        <Field
          icon={<CalendarDays className="w-4 h-4 text-primary" />}
          label={t("travelForm.preview.dates")}
          value={data.departureDate || data.returnDate ? `${data.departureDate || "—"} → ${data.returnDate || "—"}` : ""}
        />
        <Field icon={<Users className="w-4 h-4 text-primary" />} label={t("travelForm.preview.profile")} value={tOpt("travelerType", data.travelerType)} />
        <Field icon={<Wallet className="w-4 h-4 text-primary" />} label={t("travelForm.preview.totalBudget")} value={data.totalBudget ? `${data.totalBudget} €` : ""} />
        <Field icon={<Wallet className="w-4 h-4 text-primary" />} label={t("travelForm.preview.perDay")} value={perDay ? `${perDay} €` : ""} />
      </div>

      {(data.tripTypes?.length > 0 || data.objectives?.length > 0) && (
        <div className="space-y-2">
          {data.tripTypes?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("travelForm.preview.tripType")}</p>
              <div className="flex flex-wrap gap-1.5">
                {data.tripTypes.map((tt) => (
                  <span key={tt} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {tOpt("tripType", tt)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.objectives?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("travelForm.preview.objectives")}</p>
              <div className="flex flex-wrap gap-1.5">
                {data.objectives.map((tt) => (
                  <span key={tt} className="text-xs px-2.5 py-1 rounded-full bg-secondary/15 text-secondary-foreground font-medium">
                    {tOpt("objective", tt)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-border/50 flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{t("travelForm.preview.footnote")}</p>
        <Button onClick={onResume} className="gradient-button text-primary-foreground border-0">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("travelForm.preview.resume")}
        </Button>
      </div>
    </motion.div>
  );
};

export default TripPreview;
