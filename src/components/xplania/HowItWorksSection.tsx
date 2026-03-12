import { motion } from "framer-motion";

const steps = [
  {
    num: 1,
    title: "Créer votre voyage",
    desc: "Renseignez votre destination, vos dates et le type de voyage que vous souhaitez faire.",
    soon: false,
  },
  {
    num: 2,
    title: "Préparer votre voyage",
    desc: "Accédez à votre budget estimé, aux démarches administratives et à votre valise intelligente.",
    soon: false,
  },
  {
    num: 3,
    title: "Profiter du voyage",
    desc: "Suivi de voyage, carnet de bord et recommandations locales arriveront prochainement.",
    soon: true,
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Comment fonctionne Xplania</h2>
          <p className="mt-3 text-muted-foreground">Une approche simple en trois étapes pour voyager sereinement</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl gradient-button flex items-center justify-center text-2xl font-bold text-primary-foreground mb-5">
                {s.num}
              </div>
              <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
              {s.soon && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold">
                  Bientôt
                </span>
              )}
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
