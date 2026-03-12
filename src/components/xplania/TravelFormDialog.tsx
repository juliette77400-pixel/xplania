import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { TravelFormData, TravelPlan } from "@/types/travel";
import StepDestination from "@/components/xplania/form-steps/StepDestination";
import StepDates from "@/components/xplania/form-steps/StepDates";
import StepTravelers from "@/components/xplania/form-steps/StepTravelers";
import StepTripType from "@/components/xplania/form-steps/StepTripType";
import StepBudget from "@/components/xplania/form-steps/StepBudget";
import StepAccommodation from "@/components/xplania/form-steps/StepAccommodation";
import StepTransport from "@/components/xplania/form-steps/StepTransport";
import StepDietary from "@/components/xplania/form-steps/StepDietary";
import StepActivities from "@/components/xplania/form-steps/StepActivities";
import StepLuggage from "@/components/xplania/form-steps/StepLuggage";
import StepWeather from "@/components/xplania/form-steps/StepWeather";
import StepGenerate from "@/components/xplania/form-steps/StepGenerate";
import TravelPlanResults from "@/components/xplania/TravelPlanResults";

const STEP_LABELS = [
  "Destination", "Dates", "Voyageurs", "Type de voyage", "Budget",
  "Hébergement", "Transport", "Alimentation", "Activités", "Bagages",
  "Météo", "Génération IA"
];

const defaultFormData: TravelFormData = {
  destination: "",
  departure: "",
  dateMode: "dates",
  departureDate: "",
  returnDate: "",
  duration: 7,
  travelerCount: 1,
  travelerType: "solo",
  tripTypes: [],
  tripTypeOther: "",
  totalBudget: 0,
  accommodations: [],
  accommodationOther: "",
  transports: [],
  transportPreference: "",
  dietaryPreferences: [],
  dietaryOther: "",
  activities: [],
  activityOther: "",
  luggageType: "cabine",
};

interface TravelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TravelFormDialog = ({ open, onOpenChange }: TravelFormDialogProps) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<TravelFormData>(defaultFormData);
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [generating, setGenerating] = useState(false);

  const updateForm = (partial: Partial<TravelFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const totalSteps = STEP_LABELS.length;

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      const days = formData.dateMode === "duration"
        ? formData.duration
        : Math.max(1, Math.ceil((new Date(formData.returnDate).getTime() - new Date(formData.departureDate).getTime()) / 86400000));

      const budget = formData.totalBudget || 1500;

      setPlan({
        budgetEstimate: {
          total: budget,
          perDay: Math.round(budget / days),
          breakdown: [
            { category: "Hébergement", amount: Math.round(budget * 0.35) },
            { category: "Transport", amount: Math.round(budget * 0.25) },
            { category: "Alimentation", amount: Math.round(budget * 0.2) },
            { category: "Activités", amount: Math.round(budget * 0.15) },
            { category: "Divers", amount: Math.round(budget * 0.05) },
          ],
        },
        documents: [
          "Passeport valide (6 mois après retour)",
          `Visa requis pour ${formData.destination || "votre destination"}`,
          "Assurance voyage internationale",
          "Copie des réservations (hébergement + transport)",
          "Carte de vaccination si nécessaire",
          "Permis de conduire international (si location de voiture)",
        ],
        luggage: [
          "Vêtements adaptés à la météo locale",
          "Trousse de toilette (format cabine)",
          "Chargeur universel + adaptateur",
          "Médicaments personnels + trousse premiers soins",
          "Copies documents importants (papier + numérique)",
          "Sac à dos jour / sac pliable",
          formData.activities.includes("randonnées") ? "Chaussures de randonnée" : "Chaussures confortables",
          formData.activities.includes("plages") ? "Maillot de bain + crème solaire" : "",
        ].filter(Boolean),
        culturalTips: [
          `Renseignez-vous sur les coutumes locales de ${formData.destination || "votre destination"}`,
          "Apprenez quelques mots de base dans la langue locale",
          "Respectez les codes vestimentaires locaux",
          "Informez-vous sur les pourboires (montant et habitudes)",
          "Téléchargez une app de traduction hors-ligne",
        ],
        weatherInfo: `Consultez la météo de ${formData.destination || "votre destination"} 1 semaine avant le départ. Prévoyez des vêtements adaptés à la saison.`,
        localRecommendations: [
          "Privilégiez les restaurants fréquentés par les locaux",
          "Utilisez les transports en commun pour une immersion authentique",
          "Visitez les marchés locaux pour découvrir la gastronomie",
          "Réservez vos activités populaires à l'avance",
          "Gardez toujours un peu de monnaie locale sur vous",
        ],
      });
      setGenerating(false);
    }, 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(0);
      setPlan(null);
      setFormData(defaultFormData);
    }, 300);
  };

  if (plan) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text">
              Votre plan de voyage — {formData.destination}
            </DialogTitle>
          </DialogHeader>
          <TravelPlanResults plan={plan} formData={formData} />
        </DialogContent>
      </Dialog>
    );
  }

  const stepComponents = [
    <StepDestination key={0} data={formData} update={updateForm} />,
    <StepDates key={1} data={formData} update={updateForm} />,
    <StepTravelers key={2} data={formData} update={updateForm} />,
    <StepTripType key={3} data={formData} update={updateForm} />,
    <StepBudget key={4} data={formData} update={updateForm} />,
    <StepAccommodation key={5} data={formData} update={updateForm} />,
    <StepTransport key={6} data={formData} update={updateForm} />,
    <StepDietary key={7} data={formData} update={updateForm} />,
    <StepActivities key={8} data={formData} update={updateForm} />,
    <StepLuggage key={9} data={formData} update={updateForm} />,
    <StepWeather key={10} data={formData} />,
    <StepGenerate key={11} data={formData} generating={generating} onGenerate={handleGenerate} />,
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {STEP_LABELS[step]}
          </DialogTitle>
          <div className="flex items-center gap-1 mt-3">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "gradient-button" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Étape {step + 1} sur {totalSteps}
          </p>
        </DialogHeader>

        <div className="py-4 min-h-[200px]">{stepComponents[step]}</div>

        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="gradient-button text-primary-foreground border-0"
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="gradient-button text-primary-foreground border-0"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generating ? "Génération..." : "Générer mon plan"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TravelFormDialog;
