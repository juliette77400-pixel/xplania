import { motion } from "framer-motion";
import { Luggage, Wallet, FileText, BookOpen, Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    num: 1,
    icon: Luggage,
    title: "Valise intelligente",
    tagline: "Une checklist sur-mesure de ce qu'il faut emporter.",
    description:
      "On génère automatiquement la liste de bagages adaptée à votre destination, à la météo prévue et à la durée du séjour. Adieu les oublis et les valises trop lourdes.",
    benefits: ["Ne plus rien oublier d'essentiel", "Optimiser l'espace dans vos bagages"],
    link: "/guide-valise",
    cta: "Préparer ma valise",
  },
  {
    num: 2,
    icon: Wallet,
    title: "Guide budget",
    tagline: "Estimez et suivez vos dépenses pendant le voyage.",
    description:
      "On estime le coût total de votre voyage selon le pays et votre style, et vous suivez vos dépenses au fil des jours pour rester dans le cadre prévu.",
    benefits: ["Éviter les mauvaises surprises", "Adapter le budget au coût de la vie local"],
    link: "/guide-budget",
    cta: "Estimer mon budget",
  },
  {
    num: 3,
    icon: FileText,
    title: "Guide visa & démarches",
    tagline: "Sachez exactement quels papiers préparer avant de partir.",
    description:
      "On vous donne la liste précise des documents requis selon votre nationalité et votre destination : visa, passeport, vaccins, assurances.",
    benefits: ["Simplifier les démarches administratives", "Avoir tous les documents requis le jour J"],
    link: "/guide-visa",
    cta: "Voir mes démarches",
  },
  {
    num: 4,
    icon: BookOpen,
    title: "Carnet de bord",
    tagline: "Documentez et revivez votre voyage en quelques clics.",
    description:
      "Notes, photos, humeurs et lieux jour par jour. L'IA transforme vos souvenirs en récit immersif, exportable en PDF et partageable en lien public.",
    benefits: ["Garder une trace émotionnelle de chaque voyage", "Partager vos souvenirs avec vos proches"],
    link: "/carnets",
    cta: "Ouvrir mes carnets",
  },
  {
    num: 5,
    icon: Activity,
    title: "Suivi de Voyage",
    tagline: "Votre compagnon en temps réel pendant le séjour.",
    description:
      "Carte live, timeline dynamique des étapes, check-in automatique à l'arrivée et suggestions IA hyper locales selon votre position, météo et humeur.",
    benefits: ["Suivre sa progression et ses stats en direct", "Recevoir des suggestions contextuelles à proximité"],
    link: "/suivi",
    cta: "Activer le suivi live",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Préparer son voyage</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Tout ce qu'il faut pour partir l'esprit tranquille
          </h2>
          <p className="mt-3 text-muted-foreground">Trois outils simples, propulsés par l'IA, pour préparer votre voyage de A à Z</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {features.map((f, i) => (
            <motion.div
              key={f.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card rounded-2xl p-6 flex flex-col group hover:border-primary/20 transition-colors"
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fonctionnalité {f.num}
              </span>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm font-medium text-primary">{f.tagline}</p>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              <ul className="mt-4 space-y-2 flex-1">
                {f.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to={f.link}
                className="mt-6 flex items-center gap-2 text-primary text-sm font-semibold group-hover:gap-3 transition-all"
              >
                {f.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">Accès immédiat • Sans inscription</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
