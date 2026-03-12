import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, FileText, Shield, AlertTriangle,
  Lightbulb, CheckCircle, Globe, Stethoscope, Phone
} from "lucide-react";
import { useTravelContext } from "@/contexts/TravelContext";

const generalDocuments = [
  "Passeport valide minimum 6 mois après ton retour prévu.",
  "Réservations d'hébergement pour toute la durée du séjour.",
  "Billet d'avion aller-retour ou preuve de continuation du voyage.",
  "Assurance voyage couvrant les frais médicaux et le rapatriement.",
  "Copies de tous tes documents importants conservées séparément.",
  "Documents spécifiques selon ta destination et ton activité prévue.",
];

const alerts = [
  { icon: Shield, text: "Vérifie la validité de ton passeport. De nombreux pays exigent une validité d'au moins 6 mois après la date de retour prévue." },
  { icon: Stethoscope, text: "Certaines destinations exigent une assurance voyage obligatoire. Renseigne-toi avant de partir." },
];

const tips = [
  { num: 1, text: "Garde une copie digitale de tous tes documents importants dans le cloud. Cela te sauvera en cas de perte ou de vol." },
  { num: 2, text: "Note les coordonnées de l'ambassade ou du consulat de ton pays dans ta destination. C'est essentiel en cas d'urgence." },
  { num: 3, text: "Renseigne-toi sur les restrictions douanières. Chaque pays a ses règles concernant l'importation de produits alimentaires, médicaments et objets de valeur." },
  { num: 4, text: "Vérifie les recommandations sanitaires et les vaccins obligatoires pour ta destination sur le site de ton ministère des Affaires étrangères." },
];

const GuideVisaPage = () => {
  const { tripData, recommendations } = useTravelContext();
  const destination = tripData?.destination || "votre destination";

  // Use AI-generated docs if available
  const aiDocuments = recommendations?.documents?.length
    ? recommendations.documents.map((d) => String(typeof d === "object" ? Object.values(d)[0] : d))
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/#create" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">📋 Visa & Démarches</h1>
            <p className="text-xs text-muted-foreground">Informations essentielles avant ton départ</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-3xl space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/20 flex items-center justify-center">
            <FileText className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            <span className="gradient-text">Visa & Démarches Administratives</span>
          </h2>
          <p className="text-muted-foreground">
            Les informations essentielles pour <span className="text-foreground font-semibold">{destination}</span>
          </p>
        </motion.div>

        {/* Destination summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Informations du voyage</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Destination", value: destination },
              { label: "Dates", value: tripData?.departureDate && tripData?.returnDate ? `${tripData.departureDate} → ${tripData.returnDate}` : "—" },
              { label: "Durée", value: `${tripData?.duration || 7} jours` },
              { label: "Transport", value: tripData?.bookingStatus || "—" },
              { label: "Voyageur", value: tripData?.travelerType || "—" },
              { label: "Mobilité", value: tripData?.mobilityDetails || "Aucune contrainte" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-muted/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-medium text-foreground mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI-generated documents */}
        {aiDocuments && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Documents requis pour {destination}</h3>
                <p className="text-xs text-muted-foreground">Générés par IA selon votre profil</p>
              </div>
            </div>
            <ul className="space-y-3">
              {aiDocuments.map((doc, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{doc}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* General documents */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
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

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <h3 className="text-lg font-bold text-foreground mb-2">Prêt(e) pour les démarches ?</h3>
          <p className="text-sm text-muted-foreground mb-6">Tu as maintenant toutes les informations essentielles pour préparer ton voyage en toute sérénité.</p>
          <Link
            to="/#create"
            className="gradient-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default GuideVisaPage;
