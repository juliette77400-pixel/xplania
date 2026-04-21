import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
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

const LoadingState = ({ destination }: { destination: string }) => {
  const { t } = useTranslation();
  return (
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
          {t("travelForm.dashboard.loadingTitle", { destination })}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t("travelForm.dashboard.loadingDesc")}
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
};

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
  const { t, i18n } = useTranslation();
  const photoQuery = [formData.arrivalCity, formData.destination].filter(Boolean).join(" ").trim();
  const heroSrc = useDestinationImage(formData.arrivalCity || formData.destination || "", 1600, 720);
  if (loading) {
    return <LoadingState destination={formData.destination || t("travelForm.dashboard.destinationFallback")} />;
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-destructive/20 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-destructive" />
        </div>
        <p className="text-foreground font-semibold mb-2">{t("travelForm.dashboard.errorTitle")}</p>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">{error}</p>
      </motion.div>
    );
  }

  const rec = recommendations;
  if (!rec) return null;

  const days = formData.duration ? parseInt(formData.duration) || 7 : 7;
  const locale = i18n.language?.startsWith("en") ? "en-US" : "fr-FR";

  const formatDate = (d?: string) => {
    if (!d) return null;
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return d;
    }
  };

  const dep = formatDate(formData.departureDate);
  const ret = formatDate(formData.returnDate);
  const datesLabel = dep && ret ? `${dep} → ${ret}` : dep || ret || t("travelForm.dashboard.datesUndefined");
  const tOpt = (group: string, value: string) => (value ? t(`travelForm.options.${group}.${value}`, { defaultValue: value }) : "—");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <FreemiumBanner />
      {formData.destination && (
        <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden mb-2 bg-muted">
          <img
            src={heroSrc}
            alt={formData.destination}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1.5">
              {t("travelForm.dashboard.kickerDest")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {formData.destination}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {datesLabel}
              </span>
              {formData.duration && (
                <>
                  <span>•</span>
                  <span>{days} {t("travelForm.dashboard.daysUnit")}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-2">
        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm text-foreground">
          <span className="font-semibold">{t("travelForm.dashboard.successHead")}</span>{" "}
          {t("travelForm.dashboard.successDesc")}
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["summary", "weather"]} className="space-y-0">
        <SectionItem
          value="summary"
          icon={<Compass className="w-5 h-5 text-primary-foreground" />}
          iconBg="gradient-button"
          title={t("travelForm.dashboard.secSummary")}
          subtitle={t("travelForm.dashboard.secSummarySub", { destination: formData.destination, days, dates: datesLabel })}
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <MapPin className="w-4 h-4 text-primary" />, label: t("travelForm.dashboard.labelDestination"), value: formData.destination },
              { icon: <Plane className="w-4 h-4 text-primary" />, label: t("travelForm.dashboard.labelDeparture"), value: formData.departureLocation || "—" },
              { icon: <CalendarDays className="w-4 h-4 text-primary" />, label: t("travelForm.dashboard.labelDates"), value: datesLabel },
              { icon: <Users className="w-4 h-4 text-primary" />, label: t("travelForm.dashboard.labelTraveler"), value: tOpt("travelerType", formData.travelerType) },
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

        <SectionItem
          value="weather"
          icon={<CloudSun className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/20"
          title={t("travelForm.dashboard.secWeather")}
          subtitle={formData.arrivalCity || formData.destination}
        >
          <WeatherSection destination={formData.arrivalCity || formData.destination} />
        </SectionItem>

        {photoQuery && (
          <SectionItem
            value="photos"
            icon={<MapPin className="w-5 h-5 text-secondary" />}
            iconBg="bg-secondary/20"
            title={t("travelForm.dashboard.secPhotos", { place: formData.arrivalCity || formData.destination })}
            subtitle={t("travelForm.dashboard.secPhotosSub")}
          >
            <PhotoGallery query={photoQuery} perPage={6} />
          </SectionItem>
        )}

        {rec.culturalTips?.length > 0 && (
          <SectionItem
            value="culture"
            icon={<Globe className="w-5 h-5 text-secondary" />}
            iconBg="bg-secondary/20"
            title={t("travelForm.dashboard.secCulture")}
            subtitle={t("travelForm.dashboard.tipsCount", { count: rec.culturalTips.length })}
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

        {rec.activities?.length > 0 && (
          <SectionItem
            value="activities"
            icon={<MapPin className="w-5 h-5 text-accent" />}
            iconBg="bg-accent/20"
            title={t("travelForm.dashboard.secActivities")}
            subtitle={t("travelForm.dashboard.activitiesCount", { count: rec.activities.length })}
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

        {rec.budgetBreakdown?.length > 0 && (
          <SectionItem
            value="budget"
            icon={<Wallet className="w-5 h-5 text-primary-foreground" />}
            iconBg="gradient-button"
            title={t("travelForm.dashboard.secBudget")}
            subtitle={t("travelForm.dashboard.budgetSub", { total: formData.totalBudget || 1500, perDay: Math.round((formData.totalBudget || 1500) / days) })}
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

        {rec.documents?.length > 0 && (
          <SectionItem
            value="documents"
            icon={<FileText className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/20"
            title={t("travelForm.dashboard.secDocuments")}
            subtitle={t("travelForm.dashboard.docsCount", { count: rec.documents.length })}
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

        {rec.luggage?.length > 0 && (
          <SectionItem
            value="luggage"
            icon={<Luggage className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/20"
            title={t("travelForm.dashboard.secLuggage")}
            subtitle={t("travelForm.dashboard.itemsCount", { count: rec.luggage.length })}
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

        {rec.localRecommendations?.length > 0 && (
          <SectionItem
            value="local"
            icon={<MapPin className="w-5 h-5 text-primary" />}
            iconBg="bg-accent/20"
            title={t("travelForm.dashboard.secLocal")}
            subtitle={t("travelForm.dashboard.placesCount", { count: rec.localRecommendations.length })}
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
