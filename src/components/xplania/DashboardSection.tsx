import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Wallet, FileText, Luggage, ArrowRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TravelFormData, TravelRecommendations } from "@/types/travel";
import DashboardCards from "@/components/xplania/DashboardCards";

interface Props {
  onCreateTrip: () => void;
  tripData: TravelFormData | null;
  recommendations: TravelRecommendations | null;
  loading: boolean;
}

const GuideBudget = ({ formData, recommendations }: { formData: TravelFormData; recommendations: TravelRecommendations | null }) => {
  const { t } = useTranslation();
  const days = formData.duration ? parseInt(formData.duration) || 7 : 7;
  const budget = formData.totalBudget || 1500;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-1">💰 {t("dashboard.budgetGuide")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("dashboard.budgetGuideDesc", { destination: formData.destination, days })}
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 rounded-xl bg-primary/10 text-center">
            <p className="text-2xl font-bold gradient-text">{budget} €</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalBudget")}</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 text-center">
            <p className="text-2xl font-bold gradient-text">{Math.round(budget / days)} €</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.perDay")}</p>
          </div>
        </div>
        {recommendations?.budgetBreakdown && recommendations.budgetBreakdown.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">{t("dashboard.breakdown")}</p>
            {recommendations.budgetBreakdown.map((b, i) => {
              const amount = typeof b.amount === "number" ? b.amount : 0;
              const pct = budget > 0 ? Math.round((amount / budget) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{String(b.category)}</span>
                      <span className="text-muted-foreground">{amount} € ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {formData.budgetDetails && (
          <div className="mt-4 p-3 rounded-xl bg-muted/30">
            <p className="text-xs text-muted-foreground">📝 {t("dashboard.yourConstraints")}</p>
            <p className="text-sm text-foreground">{formData.budgetDetails}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const GuideVisa = ({ formData, recommendations }: { formData: TravelFormData; recommendations: TravelRecommendations | null }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-1">📋 {t("dashboard.visaGuide")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("dashboard.visaGuideDesc", { destination: formData.destination })}
        </p>
        {recommendations?.documents && recommendations.documents.length > 0 ? (
          <ul className="space-y-3">
            {recommendations.documents.map((doc, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{String(typeof doc === "object" ? Object.values(doc)[0] : doc)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("dashboard.noVisaData")}</p>
        )}
      </div>
    </div>
  );
};

const GuideValise = ({ formData, recommendations }: { formData: TravelFormData; recommendations: TravelRecommendations | null }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-1">🧳 {t("dashboard.suitcaseGuide")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("dashboard.suitcaseGuideDesc", { destination: formData.destination, days: formData.duration || 7 })}
        </p>
        {recommendations?.luggage && recommendations.luggage.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recommendations.luggage.map((item, i) => (
              <li key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 text-sm text-foreground">
                <input type="checkbox" className="rounded border-border accent-primary" />
                {String(typeof item === "object" ? Object.values(item)[0] : item)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("dashboard.noLuggageData")}</p>
        )}
        {formData.baggageTypes && formData.baggageTypes.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-muted/30">
            <p className="text-xs text-muted-foreground">🎒 {t("dashboard.yourLuggageTypes")}</p>
            <p className="text-sm text-foreground">{formData.baggageTypes.join(", ")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardSection = ({ onCreateTrip, tripData, recommendations, loading }: Props) => {
  const { t } = useTranslation();
  const hasTrip = tripData && tripData.destination;

  return (
    <section id="create" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t("dashboard.title")}</h2>
          <p className="mt-3 text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </motion.div>

        {hasTrip ? (
          <div className="max-w-3xl mx-auto">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-6 bg-muted/50 rounded-xl p-1">
                <TabsTrigger value="overview" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  📊 {t("dashboard.tabOverview")}
                </TabsTrigger>
                <TabsTrigger value="budget" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  💰 {t("dashboard.tabBudget")}
                </TabsTrigger>
                <TabsTrigger value="visa" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  📋 {t("dashboard.tabVisa")}
                </TabsTrigger>
                <TabsTrigger value="valise" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  🧳 {t("dashboard.tabSuitcase")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <DashboardCards
                  formData={tripData}
                  recommendations={recommendations}
                  loading={loading}
                  error={null}
                />
              </TabsContent>

              <TabsContent value="budget">
                <GuideBudget formData={tripData} recommendations={recommendations} />
                <div className="mt-4 text-center">
                  <Link to="/guide-budget" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    {t("dashboard.viewFullGuide")} →
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="visa">
                <GuideVisa formData={tripData} recommendations={recommendations} />
                <div className="mt-4 text-center">
                  <Link to="/guide-visa" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    {t("dashboard.viewFullGuide")} →
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="valise">
                <GuideValise formData={tripData} recommendations={recommendations} />
                <div className="mt-4 text-center">
                  <Link to="/guide-valise" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    {t("dashboard.viewFullGuide")} →
                  </Link>
                </div>
              </TabsContent>
            </Tabs>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-8"
            >
              <button
                onClick={onCreateTrip}
                className="gradient-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                {t("dashboard.modifyTrip")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto glass-card rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-foreground mb-3">{t("dashboard.createFirstTitle")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {t("dashboard.createFirstDesc")}
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Wallet, label: t("dashboard.smartBudget") },
                { icon: FileText, label: t("dashboard.requiredDocs") },
                { icon: Luggage, label: t("dashboard.luggageList") },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 text-center">
                  <item.icon className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onCreateTrip}
              className="gradient-button w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              {t("dashboard.createCta")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default DashboardSection;
