import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Crown,
  FileText,
  Palette,
  Bot,
  Globe,
  Glasses,
  Layers,
  Star,
  Bell,
} from "lucide-react";
import { usePlanStore } from "@/stores/usePlanStore";
import { Progress } from "@/components/ui/progress";
import WaitlistDialog from "@/components/xplania/WaitlistDialog";

type BillingCycle = "monthly" | "yearly" | "season3" | "season6" | "perTrip";

const BILLING_TABS: { key: BillingCycle; label: string }[] = [
  { key: "monthly", label: "Mensuel" },
  { key: "yearly", label: "Annuel" },
  { key: "season3", label: "Saison 3 mois" },
  { key: "season6", label: "Saison 6 mois" },
  { key: "perTrip", label: "À l'usage" },
];

const SUFFIX: Record<BillingCycle, string> = {
  monthly: "/mois",
  yearly: "/an",
  season3: "/3 mois",
  season6: "/6 mois",
  perTrip: "/voyage",
};

interface Pack {
  id: string;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  premium?: boolean;
  recommended?: boolean;
  features: string[];
  prices: Record<BillingCycle, number>;
  yearlyNote?: string;
}

const packs: Pack[] = [
  {
    id: "admin",
    name: "Pack Administratif",
    icon: <FileText className="w-5 h-5" />,
    tagline: "Pour voyager sereinement en gérant tout l'aspect pratique",
    features: [
      "Guide budget (planification et suivi des dépenses)",
      "Guide valise intelligente (check-list adaptée à la destination)",
      "Gestion administrative (visas, documents, formalités)",
    ],
    prices: { monthly: 5.99, yearly: 59.9, season3: 20.97, season6: 39.9, perTrip: 7.99 },
    yearlyNote: "≈ 2 mois offerts",
  },
  {
    id: "creatif",
    name: "Pack Créatif",
    icon: <Palette className="w-5 h-5" />,
    tagline: "Pour vivre son voyage comme une expérience unique et ludique",
    features: [
      "Carnet de bord personnalisé (journal interactif, photos, souvenirs)",
      "Mood Explorer (activités et lieux selon l'humeur)",
      "Gamification avec badges (défis, succès à débloquer)",
    ],
    prices: { monthly: 5.99, yearly: 59.9, season3: 20.97, season6: 39.9, perTrip: 7.99 },
    yearlyNote: "≈ 2 mois offerts",
  },
  {
    id: "ia",
    name: "Pack IA",
    icon: <Bot className="w-5 h-5" />,
    tagline: "Pour un accompagnement intelligent et ultra-personnalisé",
    premium: true,
    features: [
      "Analyse et approfondissement d'un itinéraire existant",
      "Accompagnement destination de A à Z (planification complète par IA)",
    ],
    prices: { monthly: 11.99, yearly: 119.9, season3: 41.97, season6: 79.9, perTrip: 14.99 },
    yearlyNote: "≈ 2 mois offerts",
  },
  {
    id: "intercultural",
    name: "Pack Interculturel",
    icon: <Globe className="w-5 h-5" />,
    tagline: "Pour voyager en respectant et comprenant la culture locale",
    features: [
      "Guide interculturel (codes, traditions, comportements)",
      "Recommandations locales (agences et freelances locaux)",
    ],
    prices: { monthly: 5.99, yearly: 59.9, season3: 20.97, season6: 39.9, perTrip: 7.99 },
    yearlyNote: "≈ 2 mois offerts",
  },
  {
    id: "futur",
    name: "Pack Futur",
    icon: <Glasses className="w-5 h-5" />,
    tagline: "Pour explorer et s'inspirer avant même de partir",
    premium: true,
    features: [
      "Réalité virtuelle (visites immersives en 3D avant le départ)",
      "Réalité augmentée (informations contextuelles pendant le voyage)",
    ],
    prices: { monthly: 12.99, yearly: 129.9, season3: 45.97, season6: 85.9, perTrip: 15.99 },
    yearlyNote: "≈ 2 mois offerts",
  },
  {
    id: "all",
    name: "All Access",
    icon: <Crown className="w-5 h-5" />,
    tagline: "Tous les packs + mises à jour exclusives",
    recommended: true,
    features: [
      "Accès complet aux 5 packs (Admin, Créatif, IA, Interculturel, Futur)",
      "Mises à jour exclusives en avant-première",
      "Économie d'environ 8€/mois par rapport à l'achat séparé",
    ],
    prices: { monthly: 24.99, yearly: 249.9, season3: 74.97, season6: 139.9, perTrip: 39.99 },
  },
];

const doublePacks = [
  { name: "Administratif + Créatif", price: 11.49 },
  { name: "IA + Futur", price: 21.99 },
  { name: "Interculturel + Créatif", price: 11.89 },
  { name: "Administratif + IA", price: 15.79 },
  { name: "Administratif + Futur", price: 16.79 },
  { name: "Interculturel + IA", price: 16.29 },
  { name: "Interculturel + Futur", price: 17.09 },
];

const triplePacks = [
  { name: "Administratif + Créatif + Interculturel", price: 15.99 },
  { name: "IA + Administratif + Créatif", price: 20.49 },
  { name: "IA + Futur + Administratif", price: 25.49 },
  { name: "IA + Futur + Créatif", price: 25.99 },
  { name: "IA + Futur + Interculturel", price: 25.59 },
];

const formatPrice = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const Offres = () => {
  const { tier, generationsUsed, freeQuota } = usePlanStore();
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistPack, setWaitlistPack] = useState<string | undefined>(undefined);

  const openWaitlist = (packName?: string) => {
    setWaitlistPack(packName);
    setWaitlistOpen(true);
  };

  const usedPercent = useMemo(
    () => Math.min(100, Math.round((generationsUsed / freeQuota) * 100)),
    [generationsUsed, freeQuota],
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-6xl">
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
            Démarrez gratuitement, puis composez votre abonnement pack par pack.
          </p>
        </motion.div>

        {/* FREE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 sm:p-8 mb-10 max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Gratuit</h2>
              <p className="text-xs text-muted-foreground">Pour découvrir Xplania</p>
            </div>
            {tier === "free" && (
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                Actuel
              </span>
            )}
          </div>
          <div className="my-4">
            <span className="text-4xl font-bold text-foreground">0 €</span>
            <span className="text-sm text-muted-foreground"> / pour toujours</span>
          </div>
          <ul className="space-y-3 mb-5">
            {[
              "3 générations de voyage offertes (pour tester les 3 questionnaires)",
              "Guides essentiels (valise, budget, visa)",
              "Aperçu des fonctionnalités avancées",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* Generation counter */}
          <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">
                {generationsUsed} / {freeQuota} générations utilisées
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {Math.max(0, freeQuota - generationsUsed)} restante(s)
              </span>
            </div>
            <Progress value={usedPercent} className="h-2" />
          </div>
        </motion.div>

        {/* PRICING SECTION */}
        <section id="tarifs" className="scroll-mt-24">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Nos packs à la carte
            </h2>
            <p className="text-sm text-muted-foreground">
              Choisissez vos packs et la durée qui vous convient.
            </p>
          </div>

          {/* Billing tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {BILLING_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setBilling(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  billing === tab.key
                    ? "gradient-button text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {billing === "perTrip" && (
            <p className="text-center text-xs text-muted-foreground italic mb-6 max-w-xl mx-auto">
              Idéal pour les voyageurs occasionnels qui partent 1 à 2 fois par an.
              Payez uniquement quand vous en avez besoin, sans engagement.
            </p>
          )}
          {billing !== "perTrip" && <div className="mb-6" />}

          {/* Pack cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((pack, i) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04 }}
                className={`relative glass-card rounded-2xl p-6 flex flex-col overflow-hidden ${
                  pack.recommended ? "border border-primary/50" : ""
                }`}
              >
                {pack.recommended && (
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{ background: "var(--gradient-primary)" }}
                  />
                )}
                <div className="relative flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      pack.premium || pack.recommended
                        ? "gradient-button text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {pack.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {pack.recommended && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/30 text-primary-foreground">
                        Recommandé
                      </span>
                    )}
                    {pack.premium && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Premium
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="relative text-lg font-bold text-foreground mb-1">
                  {pack.name}
                </h3>
                <p className="relative text-xs text-muted-foreground mb-4 min-h-[32px]">
                  {pack.tagline}
                </p>

                <div className="relative mb-4">
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(pack.prices[billing])}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {SUFFIX[billing]}
                  </span>
                  {billing === "yearly" && pack.yearlyNote && (
                    <p className="text-[11px] text-primary mt-1">{pack.yearlyNote}</p>
                  )}
                </div>

                <ul className="relative space-y-2 mb-5 flex-1">
                  {pack.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-xs text-foreground"
                    >
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => openWaitlist(pack.name)}
                  className="relative w-full py-2.5 rounded-lg text-xs font-semibold gradient-button text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Notifie-moi au lancement
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* COMBO DISCOUNTS */}
        <section className="mt-14">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-3">
              <Layers className="w-3.5 h-3.5" />
              Économisez en combinant
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Combinez vos packs et économisez
            </h2>
            <p className="text-sm text-muted-foreground">
              2 packs → −15 % &nbsp;|&nbsp; 3 packs → −20 % &nbsp;|&nbsp; 4 packs → −25 %
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Packs doubles</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  −12 à −15 %
                </span>
              </div>
              <ul className="space-y-2.5">
                {doublePacks.map((p) => (
                  <li
                    key={p.name}
                    className="flex items-center justify-between text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-foreground">{p.name}</span>
                    <span className="font-semibold text-primary whitespace-nowrap">
                      {formatPrice(p.price)}/mois
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Packs triples</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  −18 à −20 %
                </span>
              </div>
              <ul className="space-y-2.5">
                {triplePacks.map((p) => (
                  <li
                    key={p.name}
                    className="flex items-center justify-between text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-foreground">{p.name}</span>
                    <span className="font-semibold text-primary whitespace-nowrap">
                      {formatPrice(p.price)}/mois
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Bêta en cours — les paiements ne sont pas encore actifs. Toutes les
          fonctionnalités gratuites restent accessibles pendant cette phase de test.
        </p>
      </div>

      <WaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        source={waitlistPack ? `offres:pack:${waitlistPack}` : "offres:page"}
        pack={waitlistPack}
        title={waitlistPack ? `${waitlistPack} arrive bientôt 🚀` : "Le premium arrive bientôt 🚀"}
        teaser={waitlistPack
          ? `Sois le premier à débloquer le ${waitlistPack} dès l'ouverture, avec -30% en avant-première.`
          : "Laisse ton email pour être informé du lancement et obtenir -30% en avant-première."}
      />
    </div>
  );
};

export default Offres;
