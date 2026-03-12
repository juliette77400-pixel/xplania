import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Brain, CheckCircle2, Sparkles } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

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

const STEP_DESCRIPTIONS = [
  "Où et quand souhaitez-vous partir ?",
  "Parlez-nous de vous pour personnaliser votre voyage",
  "Que souhaitez-vous vivre pendant ce voyage ?",
  "Comment aimez-vous voyager ?",
  "Définissez votre enveloppe budgétaire",
  "Quel type de logement préférez-vous ?",
  "Comment comptez-vous vous déplacer ?",
  "Des besoins particuliers à prendre en compte ?",
  "Vos préférences d'environnement et bagages",
  "Une dernière touche d'inspiration !",
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
  budgetDetails: "",
  timeDetails: "",
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
  onTripGenerated?: (data: TravelFormData, recs: TravelRecommendations) => void;
  onGenerating?: (loading: boolean) => void;
}

const TravelFormDialog = ({ open, onOpenChange, onTripGenerated, onGenerating }: TravelFormDialogProps) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<TravelFormData>(defaultFormData);
  const [recommendations, setRecommendations] = useState<TravelRecommendations | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const { toast } = useToast();

  const updateForm = (partial: Partial<TravelFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const totalSteps = STEP_LABELS.length;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const handleGenerate = async () => {
    setGenerating(true);
    setShowDashboard(true);
    setAiError(null);
    setRecommendations(null);
    onGenerating?.(true);

    try {
      // Use fetch directly for better error handling
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/travel-recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ formData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Erreur serveur (${response.status})`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.recommendations) {
        throw new Error("Aucune recommandation reçue");
      }

      setRecommendations(data.recommendations);
      onTripGenerated?.(formData, data.recommendations);

      toast({
        title: "✨ Plan de voyage généré !",
        description: `Vos recommandations pour ${formData.destination} sont prêtes.`,
      });
    } catch (err: any) {
      console.error("Generation error:", err);
      const message = err?.message || "Erreur inconnue. Veuillez réessayer.";
      setAiError(message);
      toast({
        title: "Erreur de génération",
        description: message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      onGenerating?.(false);
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
      setDirection(1);
    }, 300);
  };

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  if (showDashboard) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold gradient-text">
                  Votre plan de voyage
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{formData.destination}</p>
              </div>
            </div>
          </DialogHeader>
          <DashboardCards
            formData={formData}
            recommendations={recommendations}
            loading={generating}
            error={aiError}
          />
          {aiError && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleGenerate}
                className="gradient-button text-primary-foreground border-0"
              >
                <Brain className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          )}
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
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground">
              {STEP_LABELS[step]}
            </DialogTitle>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {step + 1}/{totalSteps}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{STEP_DESCRIPTIONS[step]}</p>

          {/* Progress bar */}
          <div className="relative mt-4">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--gradient-primary)" }}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            {/* Step indicators */}
            <div className="flex justify-between mt-2">
              {STEP_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / totalSteps}%` }}
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < step
                        ? "bg-primary scale-100"
                        : i === step
                        ? "bg-primary scale-125 ring-2 ring-primary/30"
                        : "bg-muted-foreground/30 scale-75"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 30 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="py-4 min-h-[200px]"
          >
            {stepComponents[step]}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={step === 0}
            className="text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <div className="flex items-center gap-3">
            {step === totalSteps - 1 && (
              <span className="text-xs text-muted-foreground hidden sm:inline flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-primary inline" /> Dernière étape
              </span>
            )}
            {step < totalSteps - 1 ? (
              <Button
                onClick={goNext}
                className="gradient-button text-primary-foreground border-0"
              >
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="gradient-button text-primary-foreground border-0 min-w-[200px]"
              >
                <Brain className="w-4 h-4 mr-2" />
                {generating ? "Analyse en cours..." : "Générer mon plan IA"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TravelFormDialog;
