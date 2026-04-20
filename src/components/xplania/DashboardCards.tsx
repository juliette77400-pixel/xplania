import { motion } from "framer-motion";
import {
  CloudSun, Thermometer, Globe, MapPin, Wallet,
  FileText, Luggage, Compass, UtensilsCrossed, Trees,
  Mountain, Landmark, CheckCircle, CalendarDays, Users, Plane,
  Sparkles, RefreshCw, ChevronDown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { TravelFormData, TravelRecommendations } from "@/types/travel";
import { heroImage, activityImage, placeThumbnail } from "@/lib/unsplash";
import { useDestinationImage } from "@/hooks/useDestinationImage";
import FreemiumBanner from "@/components/xplania/FreemiumBanner";
import PhotoGallery from "@/components/xplania/PhotoGallery";
import WeatherSection from "@/components/valise/WeatherSection";

interface Props {
  formData: TravelFormData;
  recommendations: TravelRecommendations | null;
  loading: boolean;
  error: string | null;
}

const toText = (val: unknown): string => {
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (val && typeof val === "object") {
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

const SkeletonCard = ({ lines = 4 }: { lines?: number }) => (
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
        Notre IA génère des recommandations ultra-personnalisées basées sur votre profil de voyageur.
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
    <SkeletonCard lines={3} />
    <SkeletonCard lines={3} />
    <SkeletonCard lines={4} />
  </div>
);

/* ─── Accordion Section Wrapper ─── */
const SectionItem = ({
  value,
  icon,
  iconBg,
  title,
  subtitle,
  children,
}: {
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <AccordionItem value={value} className="glass-card rounded-2xl border-0 mb-4 overflow-hidden">
    <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]>div>.chevron]:rotate-180">
      <div className="flex items-center gap-3 w-full">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="text-left">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown className="chevron ml-auto w-5 h-5 text-muted-foreground transition-transform duration-200" />
      </div>
    </AccordionTrigger>
    <AccordionContent className="px-6 pb-5">
      {children}
    </AccordionContent>
  </AccordionItem>
);

const DashboardCards = ({ formData, recommendations, loading, error }: Props) => {
  const photoQuery = [formData.arrivalCity, formData.destination].filter(Boolean).join(" ").trim();
  const heroSrc = useDestinationImage(formData.arrivalCity || formData.destination || "", 1600, 720);
  if (loading) {
    return <LoadingState destination={formData.destination || "votre destination"} />;
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-destructive/20 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-destructive" />
        </div>
        <p className="text-foreground font-semibold mb-2">Oups, une erreur est survenue</p>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">{error}</p>
      </motion.div>
    );
  }

  const rec = recommendations;
  if (!rec) return null;

  const days = formData.duration ? parseInt(formData.duration) || 7 : 7;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <FreemiumBanner />
      {/* Hero image de la destination */}
      {formData.destination && (
        <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden mb-2 bg-muted">
          <img
            src={heroSrc}
            alt={`Vue de ${formData.destination}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1.5">
              Votre destination
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {formData.destination}
            </h2>
            {formData.duration && (
              <p className="text-sm text-muted-foreground mt-1">
                {days} jours d'aventure vous attendent
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-2">
        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm text-foreground">
          <span className="font-semibold">Plan généré !</span>{" "}
          Cliquez sur chaque section pour voir les détails.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["summary", "weather"]} className="space-y-0">
        {/* Trip Summary */}
        <SectionItem
          value="summary"
          icon={<Compass className="w-5 h-5 text-primary-foreground" />}
          iconBg="gradient-button"
          title="Résumé de votre voyage"
          subtitle={`${formData.destination} · ${days} jours`}
        >
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
        </SectionItem>

        {/* Weather temps réel via OpenWeatherMap */}
        <SectionItem
          value="weather"
          icon={<CloudSun className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/20"
          title="Météo en temps réel"
          subtitle={formData.arrivalCity || formData.destination}
        >
          <WeatherSection destination={formData.arrivalCity || formData.destination} />
        </SectionItem>

        {/* Photos Unsplash */}
        {photoQuery && (
          <SectionItem
            value="photos"
            icon={<MapPin className="w-5 h-5 text-secondary" />}
            iconBg="bg-secondary/20"
            title={`Photos de ${formData.arrivalCity || formData.destination}`}
            subtitle="Images réelles via Unsplash"
          >
            <PhotoGallery query={photoQuery} perPage={6} />
          </SectionItem>
        )}

        {/* Cultural Tips */}
        {rec.culturalTips?.length > 0 && (
          <SectionItem
            value="culture"
            icon={<Globe className="w-5 h-5 text-secondary" />}
            iconBg="bg-secondary/20"
            title="Guide culturel local"
            subtitle={`${rec.culturalTips.length} conseils`}
          >
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
          </SectionItem>
        )}

        {/* Activities */}
        {rec.activities?.length > 0 && (
          <SectionItem
            value="activities"
            icon={<MapPin className="w-5 h-5 text-accent" />}
            iconBg="bg-accent/20"
            title="Activités recommandées"
            subtitle={`${rec.activities.length} activités`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rec.activities.map((act, i) => (
                <div key={i} className="rounded-xl bg-muted/30 overflow-hidden flex flex-col">
                  <div className="relative h-28 w-full overflow-hidden bg-muted">
                    <img
                      src={activityImage(formData.destination, toText(act.name) || String(act.type), 480, 280)}
                      alt={toText(act.name)}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      {activityIcons[String(act.type)] || <Compass className="w-4 h-4 text-primary" />}
                      <p className="text-sm font-semibold text-foreground">{toText(act.name)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{toText(act.description)}</p>
                    <p className="text-xs font-medium text-primary">≈ {toText(act.estimatedCost)}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionItem>
        )}

        {/* Budget */}
        {rec.budgetBreakdown?.length > 0 && (
          <SectionItem
            value="budget"
            icon={<Wallet className="w-5 h-5 text-primary-foreground" />}
            iconBg="gradient-button"
            title="Budget estimé"
            subtitle={`${formData.totalBudget || 1500} € · ${Math.round((formData.totalBudget || 1500) / days)} €/jour`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {rec.budgetBreakdown.map((b, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{toText(b.category)}</p>
                  <p className="text-sm font-bold text-foreground">{toText(b.amount)} €</p>
                  <p className="text-[10px] text-primary mt-1">{toText(b.tip)}</p>
                </div>
              ))}
            </div>
          </SectionItem>
        )}

        {/* Documents */}
        {rec.documents?.length > 0 && (
          <SectionItem
            value="documents"
            icon={<FileText className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/20"
            title="Documents requis"
            subtitle={`${rec.documents.length} documents`}
          >
            <ul className="space-y-2">
              {rec.documents.map((doc, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {toText(doc)}
                </li>
              ))}
            </ul>
          </SectionItem>
        )}

        {/* Luggage */}
        {rec.luggage?.length > 0 && (
          <SectionItem
            value="luggage"
            icon={<Luggage className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/20"
            title="Liste de bagages"
            subtitle={`${rec.luggage.length} éléments`}
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rec.luggage.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {toText(item)}
                </li>
              ))}
            </ul>
          </SectionItem>
        )}

        {/* Local Recommendations */}
        {rec.localRecommendations?.length > 0 && (
          <SectionItem
            value="local"
            icon={<MapPin className="w-5 h-5 text-primary" />}
            iconBg="bg-accent/20"
            title="Recommandations locales"
            subtitle={`${rec.localRecommendations.length} lieux`}
          >
            <div className="space-y-3">
              {rec.localRecommendations.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                  <img
                    src={placeThumbnail(formData.destination, `${toText(item.category)} ${toText(item.name)}`, 96)}
                    alt={toText(item.name)}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize mb-1">
                      {toText(item.category)}
                    </span>
                    <p className="text-sm font-semibold text-foreground">{toText(item.name)}</p>
                    <p className="text-xs text-muted-foreground">{toText(item.description)}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionItem>
        )}
      </Accordion>
    </motion.div>
  );
};

export default DashboardCards;
