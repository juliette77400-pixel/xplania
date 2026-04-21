import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  MapPin, Calendar, User, Compass, Wallet, Home, Bus, Utensils,
  Heart, Globe, Luggage, Sparkles, AlertTriangle
} from "lucide-react";
import type { TravelFormData } from "@/types/travel";
import { Link } from "react-router-dom";

interface TripSummaryDashboardProps {
  tripData: TravelFormData | null;
}

const TripSummaryDashboard = ({ tripData }: TripSummaryDashboardProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-US";

  if (!tripData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 text-center space-y-4"
      >
        <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">{t("budget.summaryNoTrip")}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t("budget.summaryNoTripDesc")}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Compass className="w-4 h-4" />
          {t("budget.summaryCreateTrip")}
        </Link>
      </motion.div>
    );
  }

  const destination = tripData.destination || "—";
  const departure = tripData.departureLocation || "—";
  const days = tripData.duration ? parseInt(tripData.duration) || 0 : 0;
  const departureDate = tripData.departureDate
    ? new Date(tripData.departureDate).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const returnDate = tripData.returnDate
    ? new Date(tripData.returnDate).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const items = [
    { icon: MapPin, label: t("budget.summaryDestination"), value: destination, color: "text-pink-400" },
    { icon: Globe, label: t("budget.summaryDeparture"), value: departure, color: "text-sky-400" },
    { icon: Calendar, label: t("budget.summaryDates"), value: days > 0 ? `${departureDate} → ${returnDate} (${t("budget.configDays", { count: days })})` : `${departureDate} → ${returnDate}`, color: "text-primary" },
    { icon: User, label: t("budget.summaryProfile"), value: tripData.travelerType || "—", color: "text-green-400" },
    { icon: Compass, label: t("budget.summaryActivity"), value: tripData.activityLevel || "—", color: "text-orange-400" },
    { icon: Heart, label: t("budget.summaryObjectives"), value: tripData.objectives?.slice(0, 3).join(", ") || "—", color: "text-red-400" },
    { icon: Wallet, label: t("budget.summaryBudgetTotal"), value: tripData.totalBudget ? `${tripData.totalBudget} €` : "—", color: "text-yellow-400" },
    { icon: Home, label: t("budget.summaryAccommodation"), value: [tripData.accommodationType, tripData.accommodationStanding].filter(Boolean).join(" · ") || "—", color: "text-purple-400" },
    { icon: Bus, label: t("budget.summaryLocalTransport"), value: tripData.localTransport?.join(", ") || "—", color: "text-blue-400" },
    { icon: Utensils, label: t("budget.summaryDiet"), value: tripData.dietaryPreferences?.length ? tripData.dietaryPreferences.join(", ") : t("budget.summaryDietNone"), color: "text-emerald-400" },
    { icon: Luggage, label: t("budget.summaryBaggage"), value: tripData.baggageTypes?.join(", ") || t("budget.summaryBaggageStandard"), color: "text-amber-400" },
    { icon: Sparkles, label: t("budget.summaryImmersion"), value: tripData.culturalImmersion || t("budget.summaryImmersionDefault"), color: "text-indigo-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{t("budget.summaryTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("budget.summarySubtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.04 }}
            className="p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {item.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>

      {tripData.budgetDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="p-3 rounded-xl bg-primary/10 border border-primary/20"
        >
          <p className="text-xs text-muted-foreground mb-1">📝 {t("budget.summaryNotes")}</p>
          <p className="text-sm text-foreground">{tripData.budgetDetails}</p>
        </motion.div>
      )}

      {tripData.constraints?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
        >
          <p className="text-xs text-muted-foreground mb-1">⚠️ {t("budget.summaryConstraintsLabel")}</p>
          <p className="text-sm text-foreground">{tripData.constraints.join(", ")}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TripSummaryDashboard;
