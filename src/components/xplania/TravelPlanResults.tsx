import { Wallet, FileText, Luggage, Globe, CloudSun, MapPin, CheckCircle } from "lucide-react";
import type { TravelFormData, TravelPlan } from "@/types/travel";

interface Props {
  plan: TravelPlan;
  formData: TravelFormData;
}

const TravelPlanResults = ({ plan, formData }: Props) => {
  return (
    <div className="space-y-6">
      {/* Budget */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Estimation du budget</p>
            <p className="text-2xl font-bold gradient-text">{plan.budgetEstimate.total} €</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Par jour</p>
            <p className="text-lg font-bold text-foreground">{plan.budgetEstimate.perDay} €</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {plan.budgetEstimate.breakdown.map((b) => (
            <div key={b.category} className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">{b.category}</p>
              <p className="text-sm font-bold text-foreground">{b.amount} €</p>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Checklist documents</p>
        </div>
        <ul className="space-y-2">
          {plan.documents.map((doc) => (
            <li key={doc} className="flex items-start gap-2 text-sm text-foreground">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              {doc}
            </li>
          ))}
        </ul>
      </div>

      {/* Luggage */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Luggage className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Liste de bagages</p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {plan.luggage.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Cultural tips */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Conseils culturels</p>
        </div>
        <ul className="space-y-2">
          {plan.culturalTips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Weather */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <CloudSun className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Météo estimée</p>
        </div>
        <p className="text-sm text-muted-foreground">{plan.weatherInfo}</p>
      </div>

      {/* Local recommendations */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Recommandations locales</p>
        </div>
        <ul className="space-y-2">
          {plan.localRecommendations.map((rec) => (
            <li key={rec} className="flex items-start gap-2 text-sm text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TravelPlanResults;
