import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Brain } from "lucide-react";
import type { TravelFormData, TravelPlan } from "@/types/travel";
import StepBasicInfo from "@/components/xplania/form-steps/StepBasicInfo";
import StepTravelerProfile from "@/components/xplania/form-steps/StepTravelerProfile";
import StepObjectives from "@/components/xplania/form-steps/StepObjectives";
import StepTravelStyle from "@/components/xplania/form-steps/StepTravelStyle";
import StepBudget from "@/components/xplania/form-steps/StepBudget";
import StepAccommodation from "@/components/xplania/form-steps/StepAccommodation";
import StepTransport from "@/components/xplania/form-steps/StepTransport";
import StepConstraints from "@/components/xplania/form-steps/StepConstraints";
import StepEnvironment from "@/components/xplania/form-steps/StepEnvironment";
import StepInspirations from "@/components/xplania/form-steps/StepInspirations";
import TravelPlanResults from "@/components/xplania/TravelPlanResults";

const STEP_LABELS = [
  "Informations de base",
  "Profil du voyageur",
  "Objectif du voyage",
  "Style de voyage",
  "Budget",
  "Hébergement",
  "Transport",
  "Contraintes",
  "Environnement",
  "Inspirations",
];

const defaultFormData: TravelFormData = {
  destination: "",
  departureLocation: "",
  departureDate: "",
  returnDate: "",
  duration: "",
  tripTypes: [],
  travelerType: "",
  age: 0,
  activityLevel: "",
  languages: [],
  speaksLocalLanguage: "",
  needsFrenchGuide: "",
  travelExperience: "",
  objectives: [],
  objectiveOther: "",
  feelings: [],
  priorities: [],
  organization: "",
  rhythm: "",
  totalBudget: 0,
  spendingPriorities: [],
  accommodationType: "",
  accommodationTypeOther: "",
  accommodationStanding: "",
  bookingStatus: "",
  hasStopover: "",
  localTransport: [],
  hasInternationalPermit: "",
  constraints: [],
  childrenCount: 0,
  animalDetails: "",
  mobilityDetails: "",
  importantNotes: "",
  dietaryPreferences: [],
  dietaryOther: "",
  connectivity: "",
  climatePreference: "",
  environmentalSensitivity: "",
  culturalImmersion: "",
  baggageTypes: [],
  inspirations: "",
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
    const dest = formData.destination || "votre destination";

    setTimeout(() => {
      const days = formData.duration ? parseInt(formData.duration) || 7 : 7;
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
          `Visa requis pour ${dest} — vérifiez les conditions spécifiques au pays`,
          "Assurance voyage internationale couvrant la région",
          "Copie des réservations (hébergement + transport)",
          `Carte de vaccination spécifique à ${dest} si nécessaire`,
          formData.hasInternationalPermit === "Oui" ? "Permis de conduire international" : "",
        ].filter(Boolean),
        luggage: [
          `Vêtements adaptés au climat de ${dest} (${formData.climatePreference || "vérifiez la météo locale"})`,
          "Trousse de toilette (format cabine)",
          `Adaptateur électrique compatible avec ${dest}`,
          "Médicaments personnels + trousse premiers soins",
          "Copies documents importants (papier + numérique)",
          ...(formData.baggageTypes || []).map((b) => `${b} recommandé selon vos préférences`),
        ],
        culturalTips: [
          `Informez-vous sur les coutumes et traditions spécifiques de ${dest}`,
          `Apprenez les salutations et expressions courantes utilisées à ${dest}`,
          `Respectez les codes vestimentaires en vigueur dans la région de ${dest}`,
          `Renseignez-vous sur les pourboires pratiqués à ${dest}`,
          `Téléchargez une app de traduction hors-ligne adaptée à la langue de ${dest}`,
          ...(formData.culturalImmersion === "Oui" ? [`Explorez les quartiers authentiques et marchés locaux de ${dest} pour une immersion complète`] : []),
        ],
        weatherInfo: `Consultez la météo spécifique à ${dest} pour la période du ${formData.departureDate || "départ"} au ${formData.returnDate || "retour"}. Climat attendu : ${formData.climatePreference || "non précisé"}.`,
        localRecommendations: [
          `Privilégiez les restaurants fréquentés par les habitants de ${dest}`,
          `Utilisez les transports locaux de ${dest} pour une immersion authentique`,
          `Visitez les marchés et commerces typiques de ${dest}`,
          `Réservez les activités populaires de ${dest} à l'avance`,
          `Gardez de la monnaie locale de ${dest} sur vous`,
          ...(formData.environmentalSensitivity === "Forte" ? [`Privilégiez les hébergements et transports éco-responsables à ${dest}`] : []),
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
    <StepBasicInfo key={0} data={formData} update={updateForm} />,
    <StepTravelerProfile key={1} data={formData} update={updateForm} />,
    <StepObjectives key={2} data={formData} update={updateForm} />,
    <StepTravelStyle key={3} data={formData} update={updateForm} />,
    <StepBudget key={4} data={formData} update={updateForm} />,
    <StepAccommodation key={5} data={formData} update={updateForm} />,
    <StepTransport key={6} data={formData} update={updateForm} />,
    <StepConstraints key={7} data={formData} update={updateForm} />,
    <StepEnvironment key={8} data={formData} update={updateForm} />,
    <StepInspirations key={9} data={formData} update={updateForm} />,
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
              <Brain className="w-4 h-4 mr-2" />
              {generating ? "Analyse en cours..." : "Analyser mon voyage avec l'IA Xplania"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TravelFormDialog;
