import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Brain, CheckCircle2, Eye, Sparkles } from "lucide-react";
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
import ModeSelector, { type PlanMode } from "@/components/xplania/form-steps/ModeSelector";
import DashboardCards from "@/components/xplania/DashboardCards";
import TripPreview from "@/components/xplania/form-steps/TripPreview";
import { motion, AnimatePresence } from "framer-motion";

type StepKey =
  | "basic"
  | "profile"
  | "objectives"
  | "style"
  | "budget"
  | "accommodation"
  | "transport"
  | "constraints"
  | "environment"
  | "inspirations";

const STEP_META: Record<StepKey, { label: string; description: string }> = {
  basic: { label: "Informations de base", description: "Où et quand souhaitez-vous partir ?" },
  profile: { label: "Profil du voyageur", description: "Parlez-nous de vous pour personnaliser votre voyage" },
  objectives: { label: "Objectif du voyage", description: "Que souhaitez-vous vivre pendant ce voyage ?" },
  style: { label: "Style de voyage", description: "Comment aimez-vous voyager ?" },
  budget: { label: "Budget", description: "Définissez votre enveloppe budgétaire" },
  accommodation: { label: "Hébergement", description: "Quel type de logement préférez-vous ?" },
  transport: { label: "Transport", description: "Comment comptez-vous vous déplacer ?" },
  constraints: { label: "Contraintes", description: "Des besoins particuliers à prendre en compte ?" },
  environment: { label: "Environnement", description: "Vos préférences d'environnement et bagages" },
  inspirations: { label: "Inspirations", description: "Une dernière touche d'inspiration !" },
};

const MODE_STEPS: Record<PlanMode, StepKey[]> = {
  quick: ["basic", "budget", "style"],
  custom: ["basic", "profile", "objectives", "style", "budget", "accommodation", "inspirations"],
  tailored: [
    "basic",
    "profile",
    "objectives",
    "style",
    "budget",
    "accommodation",
    "transport",
    "constraints",
    "environment",
    "inspirations",
  ],
};

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
  const [mode, setMode] = useState<PlanMode | null>(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<TravelFormData>(defaultFormData);
  const [recommendations, setRecommendations] = useState<TravelRecommendations | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const [previewing, setPreviewing] = useState(false);
  const { toast } = useToast();

  const updateForm = (partial: Partial<TravelFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const activeSteps = useMemo<StepKey[]>(
    () => (mode ? MODE_STEPS[mode] : []),
    [mode],
  );
  const totalSteps = activeSteps.length;
  const currentStepKey = activeSteps[step];
  const progress = totalSteps > 0 ? Math.round(((step + 1) / totalSteps) * 100) : 0;

  const handleGenerate = async () => {
    setGenerating(true);
    setShowDashboard(true);
    setAiError(null);
    setRecommendations(null);
    onGenerating?.(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/travel-recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ formData, mode }),
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
      // Incrément du compteur de générations (freemium)
      try {
        const { usePlanStore } = await import("@/stores/usePlanStore");
        usePlanStore.getState().incrementGeneration();
      } catch {
        /* ignore */
      }

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
      setMode(null);
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

  // Étape 0 : sélection du mode
  if (!mode) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Comment voulez-vous planifier ?
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Choisissez la profondeur du questionnaire qui vous convient.
            </p>
          </DialogHeader>
          <div className="py-2">
            <ModeSelector
              onSelect={(m) => {
                setMode(m);
                setStep(0);
                setDirection(1);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderStep = (key: StepKey) => {
    switch (key) {
      case "basic": return <StepBasicInfo data={formData} update={updateForm} />;
      case "profile": return <StepTravelerProfile data={formData} update={updateForm} />;
      case "objectives": return <StepObjectives data={formData} update={updateForm} />;
      case "style": return <StepTravelStyle data={formData} update={updateForm} />;
      case "budget": return <StepBudget data={formData} update={updateForm} />;
      case "accommodation": return <StepAccommodation data={formData} update={updateForm} />;
      case "transport": return <StepTransport data={formData} update={updateForm} />;
      case "constraints": return <StepConstraints data={formData} update={updateForm} />;
      case "environment": return <StepEnvironment data={formData} update={updateForm} />;
      case "inspirations": return <StepInspirations data={formData} update={updateForm} />;
    }
  };

  const currentMeta = currentStepKey ? STEP_META[currentStepKey] : { label: "", description: "" };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-xl font-bold text-foreground">
              {currentMeta.label}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setMode(null); setStep(0); }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Changer de mode
              </button>
              <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                {step + 1}/{totalSteps}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{currentMeta.description}</p>

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
            <div className="flex justify-between mt-2">
              {activeSteps.map((_, i) => (
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

        <AnimatePresence initial={false}>
          <motion.div
            key={previewing ? "preview" : `${mode}-${step}`}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="py-4 min-h-[200px]"
          >
            {previewing ? (
              <TripPreview data={formData} onResume={() => setPreviewing(false)} />
            ) : (
              currentStepKey && renderStep(currentStepKey)
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={previewing ? () => setPreviewing(false) : goPrev}
            disabled={!previewing && step === 0}
            className="text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {previewing ? "Reprendre" : "Retour"}
          </Button>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {step === totalSteps - 1 && !previewing && (
              <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-primary" /> Dernière étape
              </span>
            )}
            {!previewing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewing(true)}
                className="border-primary/40 text-foreground hover:bg-primary/10"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir mon voyage
              </Button>
            )}
            {!previewing && step < totalSteps - 1 && (
              <Button
                onClick={goNext}
                className="gradient-button text-primary-foreground border-0"
              >
                Continuer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {!previewing && step === totalSteps - 1 && (
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
