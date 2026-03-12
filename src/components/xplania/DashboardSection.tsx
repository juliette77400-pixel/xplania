import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, FileText, Luggage, ArrowRight, CloudSun, Globe, MapPin, Compass } from "lucide-react";
import type { TravelFormData, TravelRecommendations } from "@/types/travel";
import DashboardCards from "@/components/xplania/DashboardCards";

interface Props {
  onCreateTrip: () => void;
  tripData: TravelFormData | null;
  recommendations: TravelRecommendations | null;
  loading: boolean;
}

const DashboardSection = ({ onCreateTrip, tripData, recommendations, loading }: Props) => {
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
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Votre voyage en un coup d'œil</h2>
          <p className="mt-3 text-muted-foreground">
            Un tableau de bord intuitif qui centralise toutes les informations essentielles
          </p>
        </motion.div>

        {hasTrip ? (
          <div className="max-w-3xl mx-auto">
            <DashboardCards
              formData={tripData}
              recommendations={recommendations}
              loading={loading}
              error={null}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-8"
            >
              <button
                onClick={onCreateTrip}
                className="gradient-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                Modifier mon voyage
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
            <h3 className="text-2xl font-bold text-foreground mb-3">Créez votre premier voyage</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Renseignez votre destination et vos dates pour découvrir un tableau de bord personnalisé avec budget estimé, exigences visa et recommandations bagages.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Wallet, label: "Budget intelligent" },
                { icon: FileText, label: "Documents requis" },
                { icon: Luggage, label: "Liste de bagages" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 text-center"
                >
                  <item.icon className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onCreateTrip}
              className="gradient-button w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Créer mon voyage
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default DashboardSection;
