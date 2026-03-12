import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText, Shield, AlertTriangle, Lightbulb, CheckCircle, Globe,
  Stethoscope, RotateCcw, Sparkles, Brain, Search, ShieldCheck,
  Syringe, ListChecks, Heart, Phone, MapPin, Flag
} from "lucide-react";
import { useTravelStore } from "@/stores/useTravelStore";
import { toast } from "sonner";
import ModuleNavbar from "@/components/shared/ModuleNavbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Data ──

const countries = [
  "France", "Espagne", "Italie", "Portugal", "Grèce", "Thaïlande",
  "Japon", "États-Unis", "Canada", "Australie", "Brésil", "Argentine",
  "Mexique", "Maroc", "Tunisie",
];

const GENERATION_STEPS = [
  { icon: Brain, label: "Xplania analyse votre profil voyageur…" },
  { icon: Search, label: "Xplania consulte les autorités…" },
  { icon: ShieldCheck, label: "Vérification des formalités visa…" },
  { icon: Syringe, label: "Analyse des recommandations sanitaires…" },
  { icon: ListChecks, label: "Génération de votre checklist…" },
  { icon: CheckCircle, label: "Formalités prêtes !" },
];

const generalDocuments = [
  "Passeport valide minimum 6 mois après ton retour prévu.",
  "Réservations d'hébergement pour toute la durée du séjour.",
  "Billet d'avion aller-retour ou preuve de continuation du voyage.",
  "Assurance voyage couvrant les frais médicaux et le rapatriement.",
  "Copies de tous tes documents importants conservées séparément.",
  "Documents spécifiques selon ta destination et ton activité prévue.",
];

const getVisaInfo = (destination: string) => {
  const d = destination.toLowerCase();
  if (d.includes("japon")) return {
    visa: "Visa touristique de 90 jours (exemption pour les ressortissants français).",
    security: "Pays très sûr. Faible criminalité.",
    health: ["Vaccins recommandés : hépatite A/B, encéphalite japonaise.", "Assurance maladie fortement recommandée."],
    checklist: ["Passeport valide 6 mois+", "Japan Rail Pass (à acheter avant le départ)", "Pocket Wi-Fi / SIM locale", "Carte Suica/Pasmo pour le métro", "Adaptateur de prise type A/B"],
  };
  if (d.includes("états-unis") || d.includes("usa") || d.includes("etats")) return {
    visa: "ESTA obligatoire (autorisation électronique, 14$ en ligne). Passeport biométrique requis.",
    security: "Sécurité variable selon les villes. Vigilance dans certaines zones urbaines.",
    health: ["Aucun vaccin obligatoire.", "Assurance médicale INDISPENSABLE (coûts médicaux très élevés)."],
    checklist: ["ESTA validé", "Passeport biométrique", "Assurance santé internationale", "Preuve de fonds suffisants", "Adresse du premier hébergement"],
  };
  if (d.includes("thaïlande") || d.includes("thailande")) return {
    visa: "Exemption de visa pour les séjours ≤ 30 jours (ressortissants français).",
    security: "Globalement sûr. Prudence dans les zones frontalières sud.",
    health: ["Vaccins recommandés : hépatite A/B, typhoïde, rage.", "Traitement antipaludéen dans certaines régions."],
    checklist: ["Passeport valide 6 mois+", "Billet retour ou continuation", "Assurance voyage", "Preuve de fonds (≥ 20 000 THB)", "Photo d'identité de réserve"],
  };
  if (d.includes("maroc")) return {
    visa: "Pas de visa requis pour les séjours ≤ 90 jours (ressortissants français).",
    security: "Globalement sûr. Vigilance dans les zones isolées du sud.",
    health: ["Vaccins recommandés : hépatite A/B, typhoïde.", "Eau en bouteille recommandée."],
    checklist: ["Passeport valide 6 mois+", "Réservation hôtel", "Assurance voyage", "Espèces en dirhams (MAD)", "Vêtements adaptés aux coutumes locales"],
  };
  // Default EU
  return {
    visa: "Pas de visa nécessaire pour les séjours ≤ 90 jours (espace Schengen).",
    security: "Zone sûre. Vigilance habituelle dans les grandes villes.",
    health: ["Carte européenne d'assurance maladie recommandée.", "Aucun vaccin obligatoire."],
    checklist: ["Carte d'identité ou passeport", "Carte européenne d'assurance maladie", "Réservations hébergement", "Billets de transport", "Copie des documents dans le cloud"],
  };
};

const alerts = [
  { icon: Shield, text: "Vérifie la validité de ton passeport. De nombreux pays exigent une validité d'au moins 6 mois après la date de retour prévue." },
  { icon: Stethoscope, text: "Certaines destinations exigent une assurance voyage obligatoire. Renseigne-toi avant de partir pour éviter les mauvaises surprises." },
];

const tips = [
  { num: 1, text: "Garde une copie digitale de tous tes documents importants dans le cloud. Cela te sauvera en cas de perte ou de vol." },
  { num: 2, text: "Note les coordonnées de l'ambassade ou du consulat de ton pays dans ta destination. C'est essentiel en cas d'urgence." },
  { num: 3, text: "Renseigne-toi sur les restrictions douanières. Chaque pays a ses règles concernant l'importation de produits alimentaires, médicaments et objets de valeur." },
  { num: 4, text: "Vérifie les recommandations sanitaires et les vaccins obligatoires pour ta destination sur le site de ton ministère des Affaires étrangères." },
];

// ── Component ──

const GuideVisaPage = () => {
  const { tripData, recommendations } = useTravelStore();
  const contextDestination = tripData?.destination || "";

  const [selectedDestination, setSelectedDestination] = useState(contextDestination || "");
  const [selectedNationality, setSelectedNationality] = useState("France");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const destination = selectedDestination || contextDestination || "votre destination";
  const visaInfo = getVisaInfo(destination);

  const runGeneration = useCallback(async () => {
    if (!selectedDestination) {
      toast.error("Sélectionne une destination d'abord !");
      return;
    }
    setIsGenerating(true);
    setGenStep(0);
    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setGenStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 400));
    setIsGenerating(false);
    setHasGenerated(true);
    setCheckedItems({});
    toast.success("Formalités vérifiées ! 📋");
  }, [selectedDestination]);

  const handleRegenerate = useCallback(async () => {
    toast.loading("Xplania reconsulte les autorités…", { id: "regen-visa" });
    setIsGenerating(true);
    setGenStep(0);
    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 500));
      setGenStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 300));
    setIsGenerating(false);
    setCheckedItems({});
    toast.success("Formalités recalculées !", { id: "regen-visa" });
  }, []);

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const totalChecklist = visaInfo.checklist.length;
  const doneChecklist = visaInfo.checklist.filter((c) => checkedItems[c]).length;

  // AI documents from recommendations
  const aiDocuments = recommendations?.documents?.length
    ? recommendations.documents.map((d) => String(typeof d === "object" ? Object.values(d)[0] : d))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <ModuleNavbar />

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-secondary/20 flex items-center justify-center relative"
          >
            <FileText className="w-10 h-10 text-secondary" />
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
            <span className="gradient-text">Visa & Démarches Administratives</span>
          </h1>
          <p className="text-muted-foreground">Les informations essentielles avant ton départ.</p>

          {!hasGenerated && !isGenerating && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={runGeneration}
              className="mt-6 px-8 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-secondary to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
            >
              Vérifier mes besoins
            </motion.button>
          )}
        </motion.div>

        {/* Destination selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <h2 className="text-base font-bold text-foreground mb-5 text-center">Sélectionne ta destination</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-secondary">Choisir une destination</label>
              <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Sélectionne un pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" />
                        {c}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-secondary">Choisir ma nationalité</label>
              <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Sélectionne ta nationalité" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>
                      <div className="flex items-center gap-2">
                        <Flag className="w-3 h-3 text-secondary" />
                        {c}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={runGeneration}
            disabled={isGenerating || !selectedDestination}
            className="w-full mt-5 gradient-button text-primary-foreground font-bold py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Analyser
          </motion.button>
        </motion.div>

        {/* Generation animation */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-8 text-center space-y-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </motion.div>

              <div className="space-y-3 max-w-md mx-auto">
                {GENERATION_STEPS.map((step, i) => {
                  const isActive = i === genStep;
                  const isDone = i < genStep;
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: isDone || isActive ? 1 : 0.3, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isActive ? "bg-secondary/10 border border-secondary/30" : isDone ? "bg-muted/30" : ""
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isDone ? "text-green-400" : isActive ? "text-secondary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                        {step.label}
                      </span>
                      {isDone && <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />}
                    </motion.div>
                  );
                })}
              </div>

              <div className="h-2 rounded-full bg-muted/50 overflow-hidden max-w-xs mx-auto">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((genStep + 1) / GENERATION_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content after generation */}
        <AnimatePresence>
          {hasGenerated && !isGenerating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">

              {/* Visa & Security */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6 shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Formalités Visa — {destination}</h3>
                    <p className="text-xs text-muted-foreground">Nationalité : {selectedNationality}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold text-foreground">Visa</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{visaInfo.visa}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-bold text-foreground">Zone de sécurité</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{visaInfo.security}</p>
                  </div>
                </div>
              </motion.div>

              {/* Health */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6 shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Santé & Vaccins</h3>
                    <p className="text-xs text-muted-foreground">Recommandations sanitaires pour {destination}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {visaInfo.health.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                      <Heart className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{h}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Dynamic Checklist */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card rounded-2xl p-6 shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
                      <ListChecks className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Checklist Dynamique</h3>
                      <p className="text-xs text-muted-foreground">{doneChecklist}/{totalChecklist} éléments validés</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                        style={{ width: `${totalChecklist > 0 ? (doneChecklist / totalChecklist) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-primary">
                      {totalChecklist > 0 ? Math.round((doneChecklist / totalChecklist) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {visaInfo.checklist.map((item, i) => {
                    const checked = !!checkedItems[item];
                    return (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => toggleCheck(item)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                          checked
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "bg-primary border-primary" : "border-muted-foreground/40"
                        }`}>
                          {checked && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className={`text-sm ${checked ? "text-foreground line-through opacity-70" : "text-foreground"}`}>
                          {item}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* AI Documents */}
              {aiDocuments && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card rounded-2xl p-6 shadow-md"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Documents requis (IA)</h3>
                      <p className="text-xs text-muted-foreground">Générés selon votre profil voyageur</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {aiDocuments.map((doc, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">{doc}</p>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* General documents */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="glass-card rounded-2xl p-6 shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-secondary" />
                  <h3 className="text-base font-bold text-foreground">Documents généraux à préparer</h3>
                </div>
                <ul className="space-y-2">
                  {generalDocuments.map((doc, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{doc}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl p-6 shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="text-base font-bold text-foreground">Alertes importantes</h3>
                </div>
                <div className="space-y-3">
                  {alerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                      <alert.icon className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{alert.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-card rounded-2xl p-6 shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Astuces pratiques</h3>
                </div>
                <div className="space-y-3">
                  {tips.map((tip) => (
                    <div key={tip.num} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full gradient-button text-xs font-bold text-primary-foreground shrink-0">
                        {tip.num}
                      </span>
                      <p className="text-sm text-foreground">{tip.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Regenerate + CTA */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Regénérer les formalités
                </motion.button>
                <Link
                  to="/guide-budget"
                  className="gradient-button inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                >
                  Continuer mes préparatifs →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GuideVisaPage;
