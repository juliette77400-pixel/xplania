import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { TravelFormData, TravelRecommendations } from "@/types/travel";
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
import DashboardCards from "@/components/xplania/DashboardCards";

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
  tripTypeOther: "",
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
  stopoverCount: 0,
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
  const [recommendations, setRecommendations] = useState<TravelRecommendations | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateForm = (partial: Partial<TravelFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const totalSteps = STEP_LABELS.length;

  const handleGenerate = async () => {
    setGenerating(true);
    setShowDashboard(true);
    setAiError(null);
    setRecommendations(null);

    try {
      const { data, error } = await supabase.functions.invoke("travel-recommendations", {
        body: { formData },
      });

      if (error) {
        throw new Error(error.message || "Erreur lors de l'appel IA");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setRecommendations(data.recommendations);
    } catch (err: any) {
      const message = err?.message || "Erreur inconnue";
      setAiError(message);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(0);
      setShowDashboard(false);
      setRecommendations(null);
      setAiError(null);
      setFormData(defaultFormData);
    }, 300);
  };

  if (showDashboard) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text">
              Votre plan de voyage — {formData.destination}
            </DialogTitle>
          </DialogHeader>
          <DashboardCards
            formData={formData}
            recommendations={recommendations}
            loading={generating}
            error={aiError}
          />
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
