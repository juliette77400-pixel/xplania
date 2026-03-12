import { motion } from "framer-motion";
import {
  CloudSun, Thermometer, Globe, MapPin, Wallet,
  FileText, Luggage, Compass, UtensilsCrossed, Trees,
  Mountain, Landmark, CheckCircle, CalendarDays, Users, Plane
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TravelFormData, TravelRecommendations } from "@/types/travel";

interface Props {
  formData: TravelFormData;
  recommendations: TravelRecommendations | null;
  loading: boolean;
  error: string | null;
}

const cardAnim = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const activityIcons: Record<string, React.ReactNode> = {
  culture: <Landmark className="w-4 h-4 text-secondary" />,
  nature: <Trees className="w-4 h-4 text-primary" />,
  gastronomie: <UtensilsCrossed className="w-4 h-4 text-destructive" />,
  aventure: <Mountain className="w-4 h-4 text-accent" />,
};

const SkeletonCard = ({ lines = 4 }: { lines?: number }) => (
  <div className="glass-card rounded-2xl p-6 space-y-4">
    <Skeleton className="h-5 w-1/3 bg-muted" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-full bg-muted" />
    ))}
  </div>
);

const DashboardCards = ({ formData, recommendations, loading, error }: Props) => {
  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-destructive font-semibold mb-2">Erreur</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  const rec = recommendations;
  const days = formData.duration ? parseInt(formData.duration) || 7 : 7;

  return (
    <div className="space-y-6">
      {/* Trip Summary Card */}
      <motion.div {...cardAnim} transition={{ delay: 0 }} className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Résumé de votre voyage</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <MapPin className="w-4 h-4 text-primary" />, label: "Destination", value: formData.destination },
            { icon: <Plane className="w-4 h-4 text-primary" />, label: "Départ", value: formData.departureLocation || "—" },
            { icon: <CalendarDays className="w-4 h-4 text-primary" />, label: "Dates", value: `${formData.departureDate || "—"} → ${formData.returnDate || "—"}` },
            { icon: <Users className="w-4 h-4 text-primary" />, label: "Voyageur", value: formData.travelerType || "—" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2 p-3 rounded-xl bg-muted/50">
              {item.icon}
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weather Card */}
      {loading ? (
        <SkeletonCard lines={3} />
      ) : rec?.weather ? (
        <motion.div {...cardAnim} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <CloudSun className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Météo à {formData.destination}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold gradient-text">{rec.weather.temperature}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Actuellement :</span> {rec.weather.current}</p>
            <p><span className="font-medium text-foreground">Prévisions :</span> {rec.weather.forecast}</p>
            <p><span className="font-medium text-foreground">Conseil :</span> {rec.weather.advice}</p>
          </div>
        </motion.div>
      ) : null}

      {/* Cultural Tips Card */}
      {loading ? (
        <SkeletonCard lines={5} />
      ) : rec?.culturalTips?.length ? (
        <motion.div {...cardAnim} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Guide culturel local</h3>
          </div>
          <div className="space-y-3">
            {rec.culturalTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <span className="flex items-center justify-center w-6 h-6 rounded-full gradient-button text-xs font-bold text-primary-foreground shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Activities Card */}
      {loading ? (
        <SkeletonCard lines={6} />
      ) : rec?.activities?.length ? (
        <motion.div {...cardAnim} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Activités recommandées</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rec.activities.map((act, i) => (
              <div key={i} className="p-3 rounded-xl bg-muted/30 space-y-1">
                <div className="flex items-center gap-2">
                  {activityIcons[act.type] || <Compass className="w-4 h-4 text-primary" />}
                  <p className="text-sm font-semibold text-foreground">{act.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{act.description}</p>
                <p className="text-xs font-medium text-primary">≈ {act.estimatedCost}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Budget Card */}
      {loading ? (
        <SkeletonCard lines={5} />
      ) : rec?.budgetBreakdown?.length ? (
        <motion.div {...cardAnim} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Budget estimé</h3>
              <p className="text-2xl font-bold gradient-text">{formData.totalBudget || 1500} €</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Par jour</p>
              <p className="text-lg font-bold text-foreground">
                {Math.round((formData.totalBudget || 1500) / days)} €
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {rec.budgetBreakdown.map((b, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">{b.category}</p>
                <p className="text-sm font-bold text-foreground">{b.amount} €</p>
                <p className="text-[10px] text-primary mt-1">{b.tip}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Documents Card */}
      {loading ? (
        <SkeletonCard />
      ) : rec?.documents?.length ? (
        <motion.div {...cardAnim} transition={{ delay: 0.5 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Documents requis</h3>
          </div>
          <ul className="space-y-2">
            {rec.documents.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {doc}
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}

      {/* Luggage Card */}
      {loading ? (
        <SkeletonCard />
      ) : rec?.luggage?.length ? (
        <motion.div {...cardAnim} transition={{ delay: 0.6 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Luggage className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Liste de bagages</h3>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rec.luggage.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}

      {/* Local Recommendations Card */}
      {loading ? (
        <SkeletonCard lines={5} />
      ) : rec?.localRecommendations?.length ? (
        <motion.div {...cardAnim} transition={{ delay: 0.7 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recommandations locales</h3>
          </div>
          <div className="space-y-3">
            {rec.localRecommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0 capitalize">
                  {rec.category}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{rec.name}</p>
                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
};

export default DashboardCards;
