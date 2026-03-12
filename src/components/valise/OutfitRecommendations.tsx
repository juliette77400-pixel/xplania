import { motion } from "framer-motion";

interface Outfit {
  title: string;
  context: string;
  tags: string[];
  imageUrl: string;
  badge: string;
}

const defaultOutfits: Outfit[] = [
  {
    title: "Look Casual Urbain",
    context: "Visite de la ville • Shopping",
    tags: ["Ville", "18-22°C", "Exploration"],
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    badge: "Détendu",
  },
  {
    title: "Tenue Soirée Élégante",
    context: "Dîner gastronomique • Soirée",
    tags: ["Restaurant", "20°C", "Ville"],
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80",
    badge: "Raffiné",
  },
  {
    title: "Look Exploration Temple",
    context: "Visite culturelle • Temples",
    tags: ["Temple", "Variable", "Exploration"],
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=80",
    badge: "Aventurier",
  },
];

const OutfitRecommendations = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.42 }}
    className="space-y-4"
  >
    <div className="text-center">
      <h3 className="text-xl font-bold text-foreground">Tenues recommandées</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Looks adaptés à tes activités, la météo et le contexte culturel
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {defaultOutfits.map((outfit, i) => (
        <motion.div
          key={outfit.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 + i * 0.08 }}
          className="glass-card rounded-2xl overflow-hidden group"
        >
          <div className="relative h-40 overflow-hidden">
            <img
              src={outfit.imageUrl}
              alt={outfit.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-primary/20 backdrop-blur text-primary text-[10px] font-bold uppercase tracking-wider">
              {outfit.badge}
            </span>
          </div>
          <div className="p-4">
            <h4 className="text-sm font-bold text-foreground">{outfit.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{outfit.context}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {outfit.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default OutfitRecommendations;
