import { motion } from "framer-motion";
import { MessageSquare, Zap, Users } from "lucide-react";

const cards = [
  {
    icon: MessageSquare,
    title: "Feedback direct",
    desc: "Votre retour améliore directement le produit. Chaque suggestion compte pour créer l'outil de voyage idéal.",
  },
  {
    icon: Zap,
    title: "Accès anticipé",
    desc: "Découvrez les nouvelles fonctionnalités avant tout le monde et testez les innovations en avant-première.",
  },
  {
    icon: Users,
    title: "Communauté exclusive",
    desc: "Rejoignez les Early Explorers et participez à la création du futur du voyage intelligent.",
  },
];

const BetaSection = () => {
  return (
    <section id="feedback" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Pourquoi participer à la{" "}
            <span className="gradient-text">bêta Xplania</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Rejoignez une communauté exclusive de voyageurs passionnés qui façonnent le futur du voyage
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl gradient-button flex items-center justify-center mb-5">
                <c.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-xl font-bold text-foreground mb-2">Partagez votre expérience</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Votre feedback est essentiel pour améliorer Xplania et créer l'outil de voyage parfait
          </p>
          <a
            href="#"
            className="gradient-button inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="w-5 h-5" />
            Donner mon feedback
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default BetaSection;
