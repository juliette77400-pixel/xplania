import { motion } from "framer-motion";
import { Globe, AlertTriangle, Shirt, Heart } from "lucide-react";

interface CulturalTipsProps {
  destination: string;
}

// Static tips database by region keyword — will be replaced by AI later
const tipsByRegion: Record<string, { icon: React.ReactNode; title: string; tip: string }[]> = {
  default: [
    { icon: <Shirt className="w-4 h-4" />, title: "Code vestimentaire", tip: "Renseignez-vous sur les tenues appropriées selon les lieux visités (temples, restaurants, etc.)." },
    { icon: <Globe className="w-4 h-4" />, title: "Coutumes locales", tip: "Apprenez quelques mots de politesse dans la langue locale : bonjour, merci, s'il vous plaît." },
    { icon: <AlertTriangle className="w-4 h-4" />, title: "Erreurs à éviter", tip: "Évitez de photographier des personnes sans leur consentement et respectez les règles des lieux sacrés." },
    { icon: <Heart className="w-4 h-4" />, title: "Comportement", tip: "Observez les habitudes locales avant d'agir. Le respect des traditions renforce les échanges." },
  ],
  japon: [
    { icon: <Shirt className="w-4 h-4" />, title: "Tenue", tip: "Prévoyez des chaussettes propres : on retire ses chaussures souvent (temples, restaurants, maisons)." },
    { icon: <Globe className="w-4 h-4" />, title: "Salutations", tip: "Inclinez-vous légèrement pour saluer. Ne serrez pas la main sauf si proposé." },
    { icon: <AlertTriangle className="w-4 h-4" />, title: "À éviter", tip: "Ne plantez jamais vos baguettes dans le riz et ne parlez pas fort dans les transports." },
    { icon: <Heart className="w-4 h-4" />, title: "Pourboire", tip: "Le pourboire est considéré comme impoli au Japon." },
  ],
  maroc: [
    { icon: <Shirt className="w-4 h-4" />, title: "Tenue", tip: "Habillez-vous modestement, surtout dans les médinas et lieux religieux. Couvrez épaules et genoux." },
    { icon: <Globe className="w-4 h-4" />, title: "Coutumes", tip: "Utilisez la main droite pour manger et saluer. La main gauche est considérée comme impure." },
    { icon: <AlertTriangle className="w-4 h-4" />, title: "Négociation", tip: "Le marchandage est une tradition dans les souks. Commencez à 50% du prix annoncé." },
    { icon: <Heart className="w-4 h-4" />, title: "Hospitalité", tip: "Accepter le thé offert est un signe de respect. Le refuser peut être perçu comme impoli." },
  ],
  thailande: [
    { icon: <Shirt className="w-4 h-4" />, title: "Temples", tip: "Couvrez épaules et genoux pour visiter les temples. Retirez vos chaussures à l'entrée." },
    { icon: <Globe className="w-4 h-4" />, title: "Respect", tip: "Ne touchez jamais la tête de quelqu'un et ne pointez pas vos pieds vers les gens ou les images de Bouddha." },
    { icon: <AlertTriangle className="w-4 h-4" />, title: "Royauté", tip: "Montrez un grand respect envers la famille royale. Le lèse-majesté est un crime grave." },
    { icon: <Heart className="w-4 h-4" />, title: "Wai", tip: "Le 'wai' (mains jointes) est le salut traditionnel. Répondez toujours à un wai." },
  ],
};

function findTips(destination: string) {
  const lower = destination.toLowerCase();
  for (const key of Object.keys(tipsByRegion)) {
    if (key !== "default" && lower.includes(key)) return tipsByRegion[key];
  }
  return tipsByRegion.default;
}

const CulturalTips = ({ destination }: CulturalTipsProps) => {
  const tips = findTips(destination);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">Conseils culturels — {destination}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tips.map((tip, i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-primary">{tip.icon}</span>
              <p className="text-sm font-semibold text-foreground">{tip.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.tip}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default CulturalTips;
