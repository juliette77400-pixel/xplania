import { motion } from "framer-motion";
import {
  CloudSun, Thermometer, Globe, MapPin, Wallet,
  FileText, Luggage, Compass, UtensilsCrossed, Trees,
  Mountain, Landmark, CheckCircle, CalendarDays, Users, Plane,
  Sparkles, RefreshCw
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

// Helper to safely render any value as text (AI may return objects instead of strings)
const toText = (val: unknown): string => {
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (val && typeof val === "object") {
    // Extract first string value from object
    const values = Object.values(val);
    for (const v of values) {
      if (typeof v === "string") return v;
    }
    return JSON.stringify(val);
  }
  return "";
};

const activityIcons: Record<string, React.ReactNode> = {
  culture: <Landmark className="w-4 h-4 text-secondary" />,
  nature: <Trees className="w-4 h-4 text-primary" />,
  gastronomie: <UtensilsCrossed className="w-4 h-4 text-destructive" />,
  aventure: <Mountain className="w-4 h-4 text-accent" />,
};

const SkeletonCard = ({ title, lines = 4 }: { title: string; lines?: number }) => (
  <div className="glass-card rounded-2xl p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
      <Skeleton className="h-5 w-40 bg-muted" />
    </div>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-4 bg-muted ${i % 2 === 0 ? "w-full" : "w-3/4"}`} />
    ))}
  </div>
);

const LoadingState = ({ destination }: { destination: string }) => (
  <div className="space-y-6">
    {/* Loading header */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card rounded-2xl p-8 text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="w-12 h-12 mx-auto mb-4 rounded-xl gradient-button flex items-center justify-center"
      >
        <Sparkles className="w-6 h-6 text-primary-foreground" />
      </motion.div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        Analyse en cours pour {destination}...
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Notre IA génère des recommandations ultra-personnalisées basées sur votre profil de voyageur. Cela peut prendre quelques secondes.
      </p>
      <div className="mt-6 h-1.5 w-64 mx-auto rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--gradient-primary)" }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 15, ease: "easeInOut" }}
        />
      </div>
    </motion.div>

    <SkeletonCard title="Résumé" lines={3} />
    <SkeletonCard title="Météo" lines={3} />
    <SkeletonCard title="Culture" lines={5} />
    <SkeletonCard title="Activités" lines={4} />
  </div>
);

const DashboardCards = ({ formData, recommendations, loading, error }: Props) => {
  if (loading) {
    return <LoadingState destination={formData.destination || "votre destination"} />;
  }

  if (error) {
    return (
      <motion.div {...cardAnim} className="glass-card rounded-2xl p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-destructive/20 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-destructive" />
        </div>
        <p className="text-foreground font-semibold mb-2">Oups, une erreur est survenue</p>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">{error}</p>
        <p className="text-xs text-muted-foreground mt-3">Cliquez sur "Réessayer" pour relancer l'analyse.</p>
      </motion.div>
    );
  }

  const rec = recommendations;
  if (!rec) return null;

  const days = formData.duration ? parseInt(formData.duration) || 7 : 7;

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20"
      >
        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm text-foreground">
          <span className="font-semibold">Plan généré avec succès !</span>{" "}
          Voici vos recommandations personnalisées pour {formData.destination}.
        </p>
      </motion.div>

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
      {rec.weather && (
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
            <p><span className="font-medium text-foreground">Actuellement :</span> {toText(rec.weather.current)}</p>
            <p><span className="font-medium text-foreground">Prévisions :</span> {toText(rec.weather.forecast)}</p>
            <p><span className="font-medium text-foreground">Conseil :</span> {toText(rec.weather.advice)}</p>
          </div>
        </motion.div>
      )}

      {/* Cultural Tips Card */}
      {rec.culturalTips?.length > 0 && (
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
                  <p className="text-sm font-semibold text-foreground">{toText(tip.title)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{toText(tip.description)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Activities Card */}
      {rec.activities?.length > 0 && (
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
                  {activityIcons[String(act.type)] || <Compass className="w-4 h-4 text-primary" />}
                  <p className="text-sm font-semibold text-foreground">{toText(act.name)}</p>
                </div>
                <p className="text-xs text-muted-foreground">{toText(act.description)}</p>
                <p className="text-xs font-medium text-primary">≈ {toText(act.estimatedCost)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Budget Card */}
      {rec.budgetBreakdown?.length > 0 && (
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
                <p className="text-xs text-muted-foreground">{toText(b.category)}</p>
                <p className="text-sm font-bold text-foreground">{toText(b.amount)} €</p>
                <p className="text-[10px] text-primary mt-1">{toText(b.tip)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Documents Card */}
      {rec.documents?.length > 0 && (
        <motion.div {...cardAnim} transition={{ delay: 0.5 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Documents requis</h3>
          </div>
          <ul className="space-y-2">
            {rec.documents.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {toText(doc)}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Luggage Card */}
      {rec.luggage?.length > 0 && (
        <motion.div {...cardAnim} transition={{ delay: 0.6 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Luggage className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Liste de bagages</h3>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rec.luggage.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {toText(item)}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Local Recommendations Card */}
      {rec.localRecommendations?.length > 0 && (
        <motion.div {...cardAnim} transition={{ delay: 0.7 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recommandations locales</h3>
          </div>
          <div className="space-y-3">
            {rec.localRecommendations.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0 capitalize">
                  {toText(item.category)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{toText(item.name)}</p>
                  <p className="text-xs text-muted-foreground">{toText(item.description)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardCards;
