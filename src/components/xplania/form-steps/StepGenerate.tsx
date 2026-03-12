import { Sparkles, MapPin, Calendar, Users, Wallet, Luggage } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

interface Props {
  data: TravelFormData;
  generating: boolean;
  onGenerate: () => void;
}

const StepGenerate = ({ data, generating }: Props) => {
  const days = data.dateMode === "duration"
    ? data.duration
    : data.departureDate && data.returnDate
      ? Math.max(1, Math.ceil((new Date(data.returnDate).getTime() - new Date(data.departureDate).getTime()) / 86400000))
      : 0;

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Récapitulatif de votre voyage</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Destination :</span>
            <span className="text-foreground font-medium">{data.destination || "Non renseigné"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Durée :</span>
            <span className="text-foreground font-medium">{days > 0 ? `${days} jours` : "Non renseigné"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Voyageurs :</span>
            <span className="text-foreground font-medium capitalize">{data.travelerCount} ({data.travelerType})</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Budget :</span>
            <span className="text-foreground font-medium">{data.totalBudget > 0 ? `${data.totalBudget} €` : "Non renseigné"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Luggage className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Bagages :</span>
            <span className="text-foreground font-medium capitalize">{data.luggageType}</span>
          </div>
          {data.tripTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.tripTypes.map((t) => (
                <span key={t} className="px-2 py-1 rounded-lg bg-muted text-xs font-medium text-foreground capitalize">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {generating && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-12 h-12 rounded-full gradient-button animate-spin" />
          <p className="text-sm text-muted-foreground">Génération de votre plan de voyage...</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Cliquez sur "Générer mon plan" pour obtenir votre estimation de budget, checklist documents, liste de bagages et plus encore.
      </p>
    </div>
  );
};

export default StepGenerate;
