// Static content for the Visa guide page. Extracted from `GuideVisa.tsx`
// so the page component only owns render logic and stateful behaviour.
import {
  Brain,
  Search,
  ShieldCheck,
  Syringe,
  ListChecks,
  CheckCircle,
  Shield,
  Stethoscope,
} from "lucide-react";

export const GENERATION_STEPS = [
  { icon: Brain, label: "Xplania analyse votre profil voyageur…" },
  { icon: Search, label: "Xplania consulte les autorités…" },
  { icon: ShieldCheck, label: "Vérification des formalités visa…" },
  { icon: Syringe, label: "Analyse des recommandations sanitaires…" },
  { icon: ListChecks, label: "Génération de votre checklist…" },
  { icon: CheckCircle, label: "Formalités prêtes !" },
];

export const generalDocuments = [
  "Passeport valide minimum 6 mois après ton retour prévu.",
  "Réservations d'hébergement pour toute la durée du séjour.",
  "Billet d'avion aller-retour ou preuve de continuation du voyage.",
  "Assurance voyage couvrant les frais médicaux et le rapatriement.",
  "Copies de tous tes documents importants conservées séparément.",
  "Documents spécifiques selon ta destination et ton activité prévue.",
];

export const staticAlerts = [
  { icon: Shield, text: "Vérifie la validité de ton passeport. De nombreux pays exigent une validité d'au moins 6 mois après la date de retour prévue." },
  { icon: Stethoscope, text: "Certaines destinations exigent une assurance voyage obligatoire. Renseigne-toi avant de partir pour éviter les mauvaises surprises." },
];

export const staticTips = [
  { num: 1, text: "Garde une copie digitale de tous tes documents importants dans le cloud. Cela te sauvera en cas de perte ou de vol." },
  { num: 2, text: "Note les coordonnées de l'ambassade ou du consulat de ton pays dans ta destination. C'est essentiel en cas d'urgence." },
  { num: 3, text: "Renseigne-toi sur les restrictions douanières. Chaque pays a ses règles concernant l'importation de produits alimentaires, médicaments et objets de valeur." },
  { num: 4, text: "Vérifie les recommandations sanitaires et les vaccins obligatoires pour ta destination sur le site de ton ministère des Affaires étrangères." },
];

export interface VisaAIResult {
  visa: {
    required: boolean;
    type: string;
    duration: string;
    details: string;
    cost?: string;
  };
  security: {
    level: string;
    summary: string;
    zones_to_avoid?: string[];
    tips: string[];
  };
  health: {
    mandatory_vaccines?: string[];
    recommended_vaccines: string[];
    health_risks: string[];
    insurance_required: boolean;
    tips: string[];
  };
  checklist: {
    item: string;
    category: string;
    priority: string;
  }[];
  emergency_contacts: {
    embassy: string;
    local_emergency: string;
    tourist_police?: string;
  };
}

export const securityLevelConfig: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  safe: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "🟢 Sûr" },
  moderate: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "🟡 Modéré" },
  caution: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "🟠 Vigilance" },
  danger: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "🔴 Danger" },
};

export const priorityConfig: Record<string, { color: string; bg: string }> = {
  obligatoire: { color: "text-destructive", bg: "bg-destructive/10" },
  recommandé: { color: "text-primary", bg: "bg-primary/10" },
  optionnel: { color: "text-muted-foreground", bg: "bg-muted/30" },
};
