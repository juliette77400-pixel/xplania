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
import i18n from "@/i18n";

export function getGenerationSteps() {
  return [
    { icon: Brain, label: i18n.t("ui2.visaStatic.steps.analyzeProfile") },
    { icon: Search, label: i18n.t("ui2.visaStatic.steps.checkAuthorities") },
    { icon: ShieldCheck, label: i18n.t("ui2.visaStatic.steps.checkVisaRules") },
    { icon: Syringe, label: i18n.t("ui2.visaStatic.steps.analyzeHealth") },
    { icon: ListChecks, label: i18n.t("ui2.visaStatic.steps.generateChecklist") },
    { icon: CheckCircle, label: i18n.t("ui2.visaStatic.steps.ready") },
  ];
}

export function getGeneralDocuments(): string[] {
  return [
    i18n.t("ui2.visaStatic.generalDocuments.passport"),
    i18n.t("ui2.visaStatic.generalDocuments.accommodation"),
    i18n.t("ui2.visaStatic.generalDocuments.flightTicket"),
    i18n.t("ui2.visaStatic.generalDocuments.insurance"),
    i18n.t("ui2.visaStatic.generalDocuments.copies"),
    i18n.t("ui2.visaStatic.generalDocuments.specificDocs"),
  ];
}

export function getStaticAlerts() {
  return [
    { icon: Shield, text: i18n.t("ui2.visaStatic.alerts.passportValidity") },
    { icon: Stethoscope, text: i18n.t("ui2.visaStatic.alerts.mandatoryInsurance") },
  ];
}

export function getStaticTips() {
  return [
    { num: 1, text: i18n.t("ui2.visaStatic.tips.digitalCopy") },
    { num: 2, text: i18n.t("ui2.visaStatic.tips.embassyContact") },
    { num: 3, text: i18n.t("ui2.visaStatic.tips.customsRestrictions") },
    { num: 4, text: i18n.t("ui2.visaStatic.tips.healthRecommendations") },
  ];
}

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

export function getSecurityLevelConfig(): Record<
  string,
  { color: string; bg: string; border: string; label: string }
> {
  return {
    safe: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: i18n.t("ui2.visaStatic.security.safe") },
    moderate: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: i18n.t("ui2.visaStatic.security.moderate") },
    caution: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: i18n.t("ui2.visaStatic.security.caution") },
    danger: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: i18n.t("ui2.visaStatic.security.danger") },
  };
}

export const priorityConfig: Record<string, { color: string; bg: string }> = {
  obligatoire: { color: "text-destructive", bg: "bg-destructive/10" },
  recommandé: { color: "text-primary", bg: "bg-primary/10" },
  optionnel: { color: "text-muted-foreground", bg: "bg-muted/30" },
};
