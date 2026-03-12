import { motion } from "framer-motion";
import { Luggage, Wallet, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    num: 1,
    icon: Luggage,
    title: "Valise intelligente",
    description: "Génération automatique d'une liste de bagages selon destination, météo et durée du séjour.",
    benefits: ["Ne rien oublier d'essentiel", "Optimiser l'espace de vos bagages"],
    link: "/guide-valise",
  },
  {
    num: 2,
    icon: Wallet,
    title: "Guide budget",
    description: "Estimation du coût du voyage et suivi des dépenses.",
    benefits: ["Éviter les mauvaises surprises financières", "Adapter le budget selon le coût de la vie local"],
    link: "/guide-budget",
  },
  {
    num: 3,
    icon: FileText,
    title: "Guide visa & démarches",
    description: "Checklist personnalisée des documents nécessaires pour voyager.",
    benefits: ["Simplifier les démarches administratives", "S'assurer d'avoir tous les documents requis"],
    link: "/guide-visa",
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
            Fonctionnalités principales pour voyager sans stress
          </h2>
          <p className="mt-3 text-muted-foreground">Fonctionnalités testées dans la bêta</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
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
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">{f.description}</p>
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
                Découvrir le guide
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">Accès instantané • Sans inscription</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
