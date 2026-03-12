import { motion } from "framer-motion";
import { Clock, Shield, BarChart3 } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Gain de temps",
    desc: "Ne passez plus des heures à chercher des infos contradictoires sur les visas ou le budget. Xplania centralise tout.",
  },
  {
    icon: Shield,
    title: "Sérénité totale",
    desc: "Partez avec la certitude de n'avoir rien oublié grâce à une planification intelligente et personnalisée.",
  },
  {
    icon: BarChart3,
    title: "Contrôle absolu",
    desc: "Gérez votre budget en temps réel avec des estimations basées sur le coût de la vie local.",
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Voyagez l'esprit léger,{" "}
            <span className="gradient-text">l'IA s'occupe du reste</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
            Xplania n'est pas juste un site, c'est votre copilote de voyage intelligent. Nous éliminons la charge mentale du budget, des visas et des bagages pour vous laisser l'essentiel : le plaisir de découvrir.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl gradient-button flex items-center justify-center mb-5">
                <b.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{b.title}</h3>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
