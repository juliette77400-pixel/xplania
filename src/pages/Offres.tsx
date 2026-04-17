import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Crown,
  Infinity as InfinityIcon,
  BookOpen,
  Map,
  Trophy,
  Globe,
} from "lucide-react";
import { usePlanStore } from "@/stores/usePlanStore";

const freeFeatures = [
  { icon: <Map className="w-4 h-4" />, label: "1 génération de voyage" },
  { icon: <BookOpen className="w-4 h-4" />, label: "Guides essentiels (valise, budget, visa)" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Aperçu des fonctionnalités avancées" },
];

const premiumFeatures = [
  { icon: <InfinityIcon className="w-4 h-4" />, label: "Voyages illimités" },
  { icon: <Map className="w-4 h-4" />, label: "Itinéraires complets ultra-personnalisés" },
  { icon: <Globe className="w-4 h-4" />, label: "Guide interculturel approfondi" },
  { icon: <BookOpen className="w-4 h-4" />, label: "Carnet de bord interactif" },
  { icon: <Trophy className="w-4 h-4" />, label: "Gamification & recommandations avancées" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Support prioritaire" },
];

const Offres = () => {
  const { tier } = usePlanStore();

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary mb-3">
            Offres Xplania
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Choisissez la formule qui vous correspond
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Démarrez gratuitement, passez à Premium quand vous êtes prêt à voyager
            sans limite.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Gratuit</h2>
              {tier === "free" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  Actuel
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Pour découvrir Xplania et planifier votre prochain voyage.
            </p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">0 €</span>
              <span className="text-sm text-muted-foreground"> / pour toujours</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {freeFeatures.map((f) => (
                <li key={f.label} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-3 rounded-lg text-sm font-semibold bg-muted text-muted-foreground cursor-not-allowed"
            >
              Formule actuelle
            </button>
          </motion.div>

          {/* Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="relative glass-card rounded-2xl p-6 sm:p-8 flex flex-col border border-primary/40 overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ background: "var(--gradient-primary)" }}
            />
            <div className="relative flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Premium</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/30 text-primary-foreground">
                Recommandé
              </span>
            </div>
            <p className="relative text-sm text-muted-foreground mb-5">
              Pour les voyageurs réguliers qui veulent une expérience complète.
            </p>
            <div className="relative mb-6">
              <span className="text-4xl font-bold text-foreground">Bientôt</span>
              <p className="text-xs text-muted-foreground mt-1">
                Tarifs annoncés à la sortie de la version 1.0
              </p>
            </div>
            <ul className="relative space-y-3 mb-6 flex-1">
              {premiumFeatures.map((f) => (
                <li key={f.label} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="w-6 h-6 rounded-full gradient-button flex items-center justify-center text-primary-foreground shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
            <button
              className="relative w-full py-3 rounded-lg text-sm font-semibold gradient-button text-primary-foreground hover:opacity-90 transition-opacity"
              onClick={() =>
                alert(
                  "Premium arrive bientôt ! Vous serez notifié à l'ouverture des inscriptions.",
                )
              }
            >
              Me prévenir au lancement
            </button>
          </motion.div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Bêta en cours — toutes les fonctionnalités restent accessibles pendant cette
          phase de test.
        </p>
      </div>
    </div>
  );
};

export default Offres;
