import { motion } from "framer-motion";
import { PiggyBank } from "lucide-react";

const savingTips = [
  { title: "Mange local", desc: "Mange local pour réduire les coûts et découvrir la vraie cuisine de ta destination.", emoji: "🍜" },
  { title: "Transports publics", desc: "Utilise les transports publics plutôt que les taxis pour économiser jusqu'à 70%.", emoji: "🚌" },
  { title: "Musées gratuits", desc: "Visite les musées gratuits le lundi ou profite des jours d'entrée gratuite.", emoji: "🏛️" },
  { title: "Réservations de dernière minute", desc: "Réserve certaines activités la veille pour bénéficier de réductions jusqu'à 30%.", emoji: "🎟️" },
  { title: "Shopping malin", desc: "Achète tes souvenirs dans les marchés locaux plutôt que dans les zones touristiques.", emoji: "🛍️" },
  { title: "Petit-déjeuner inclus", desc: "Choisis un hébergement avec petit-déjeuner inclus pour économiser sur les repas.", emoji: "🥐" },
  { title: "Free walking tours", desc: "Participe aux visites guidées gratuites (à pourboire) pour explorer sans te ruiner.", emoji: "🚶" },
  { title: "Pass touristique", desc: "Achète un pass touristique si tu comptes visiter plusieurs attractions payantes.", emoji: "🎫" },
];

const BudgetTips = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <PiggyBank className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Astuces Économies</h2>
          <p className="text-sm text-muted-foreground">Des conseils pratiques pour voyager malin et économiser</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {savingTips.map((tip, i) => (
          <motion.div
            key={tip.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors shadow-md cursor-default"
          >
            <span className="text-2xl block mb-2">{tip.emoji}</span>
            <h3 className="text-sm font-bold text-foreground mb-1">{tip.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default BudgetTips;
