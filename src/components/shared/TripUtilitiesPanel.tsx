// ✨ NEW — Panneau utilitaires voyage (countdown + météo + devise)
// Utilisé dans Carnet (header trip) et Dashboard (résumé prochain voyage)
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import TripCountdown from "./TripCountdown";
import DestinationWeather from "./DestinationWeather";
import CurrencyConverter from "./CurrencyConverter";

interface Props {
  destination?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  variant?: "full" | "compact";
}

const TripUtilitiesPanel = ({ destination, departureDate, returnDate, variant = "full" }: Props) => {
  const { t } = useTranslation();

  if (variant === "compact") {
    return (
      <Card className="p-4 bg-card/60 backdrop-blur-sm border-primary/20">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">{t("tripUtils.kicker")}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <TripCountdown departureDate={departureDate} returnDate={returnDate} compact />
              <DestinationWeather destination={destination} compact />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5 bg-card/60 backdrop-blur-sm border-primary/20 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <TripCountdown departureDate={departureDate} returnDate={returnDate} />
        <DestinationWeather destination={destination} />
      </div>
      <div className="border-t border-border/50 pt-4">
        <CurrencyConverter destination={destination} />
      </div>
    </Card>
  );
};

export default TripUtilitiesPanel;
