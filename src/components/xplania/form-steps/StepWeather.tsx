import { CloudSun, Thermometer, Droplets, Wind } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

interface Props {
  data: TravelFormData;
}

const StepWeather = ({ data }: Props) => {
  const dest = data.destination || "votre destination";

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
            <CloudSun className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Météo & Saison</p>
            <p className="text-xs text-muted-foreground">Recommandations pour {dest}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Thermometer className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Température</p>
              <p className="text-sm font-semibold text-foreground">18-28°C</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Droplets className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Précipitations</p>
              <p className="text-sm font-semibold text-foreground">Modérées</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Wind className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Vent</p>
              <p className="text-sm font-semibold text-foreground">Léger</p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Ces données sont des estimations générales. Consultez un service météo fiable quelques jours avant votre départ pour {dest} afin d'adapter vos bagages.
        </p>
      </div>
    </div>
  );
};

export default StepWeather;
