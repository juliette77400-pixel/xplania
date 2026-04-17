import { motion } from "framer-motion";
import { ArrowLeft, MapPin, CalendarDays, Wallet, Users, Plane, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { heroImage } from "@/lib/unsplash";
import type { TravelFormData } from "@/types/travel";

interface Props {
  data: TravelFormData;
  onResume: () => void;
}

const Field = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate">{value || "—"}</p>
    </div>
  </div>
);

const TripPreview = ({ data, onResume }: Props) => {
  const days = data.duration ? parseInt(data.duration) || 0 : 0;
  const perDay = days > 0 && data.totalBudget > 0 ? Math.round(data.totalBudget / days) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Hero image */}
      <div className="relative h-40 sm:h-52 rounded-2xl overflow-hidden">
        <img
          src={heroImage(data.destination || "voyage", 1200, 500)}
          alt={data.destination ? `Aperçu de ${data.destination}` : "Aperçu de votre voyage"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wide">
              Aperçu de votre voyage
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground">
            {data.destination || "Destination à choisir"}
          </h3>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field
          icon={<MapPin className="w-4 h-4 text-primary" />}
          label="Destination"
          value={data.destination}
        />
        <Field
          icon={<Plane className="w-4 h-4 text-primary" />}
          label="Départ"
          value={data.departureLocation}
        />
        <Field
          icon={<CalendarDays className="w-4 h-4 text-primary" />}
          label="Dates"
          value={
            data.departureDate || data.returnDate
              ? `${data.departureDate || "—"} → ${data.returnDate || "—"}`
              : ""
          }
        />
        <Field
          icon={<Users className="w-4 h-4 text-primary" />}
          label="Profil"
          value={data.travelerType}
        />
        <Field
          icon={<Wallet className="w-4 h-4 text-primary" />}
          label="Budget total"
          value={data.totalBudget ? `${data.totalBudget} €` : ""}
        />
        <Field
          icon={<Wallet className="w-4 h-4 text-primary" />}
          label="Budget / jour"
          value={perDay ? `${perDay} €` : ""}
        />
      </div>

      {/* Tags */}
      {(data.tripTypes?.length > 0 || data.objectives?.length > 0) && (
        <div className="space-y-2">
          {data.tripTypes?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Type de voyage</p>
              <div className="flex flex-wrap gap-1.5">
                {data.tripTypes.map((t) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.objectives?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Objectifs</p>
              <div className="flex flex-wrap gap-1.5">
                {data.objectives.map((t) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-secondary/15 text-secondary-foreground font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-border/50 flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Cet aperçu se met à jour à chaque étape complétée.
        </p>
        <Button onClick={onResume} className="gradient-button text-primary-foreground border-0">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Reprendre
        </Button>
      </div>
    </motion.div>
  );
};

export default TripPreview;
