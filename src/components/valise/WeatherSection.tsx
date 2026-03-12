import { motion } from "framer-motion";
import { CloudSun, Thermometer, Droplets, Wind } from "lucide-react";

export interface WeatherInfo {
  temperature?: string;
  humidity?: string;
  wind?: string;
  conditions?: string;
  advice: string[];
}

interface WeatherSectionProps {
  weather: WeatherInfo | null;
  destination: string;
}

const WeatherSection = ({ weather, destination }: WeatherSectionProps) => {
  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <CloudSun className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">Météo prévue — {destination}</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {weather.temperature && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
            <Thermometer className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Température</p>
              <p className="text-sm font-semibold text-foreground">{weather.temperature}</p>
            </div>
          </div>
        )}
        {weather.humidity && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
            <Droplets className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Humidité</p>
              <p className="text-sm font-semibold text-foreground">{weather.humidity}</p>
            </div>
          </div>
        )}
        {weather.wind && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
            <Wind className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Vent</p>
              <p className="text-sm font-semibold text-foreground">{weather.wind}</p>
            </div>
          </div>
        )}
        {weather.conditions && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
            <CloudSun className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Conditions</p>
              <p className="text-sm font-semibold text-foreground">{weather.conditions}</p>
            </div>
          </div>
        )}
      </div>

      {weather.advice.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conseils météo</p>
          {weather.advice.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
              <span className="text-primary text-sm mt-0.5">💡</span>
              <p className="text-sm text-foreground">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default WeatherSection;
