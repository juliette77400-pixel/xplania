import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CloudSun, Thermometer, Eye, Shirt, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Outfit {
  title: string;
  context: string;
  tags: string[];
  imageUrl: string;
  badge: string;
  items: string[];
  weatherTip: string;
  culturalTip: string;
}

interface OutfitRecommendationsProps {
  tripType?: string;
  destination?: string;
}

const allOutfits: Outfit[] = [
  {
    title: "Look Casual Urbain",
    context: "Visite de la ville • Shopping",
    tags: ["Ville", "18-22°C", "Exploration"],
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    badge: "Détendu",
    items: ["T-shirt coton bio", "Jean slim confortable", "Sneakers blanches", "Sac bandoulière", "Montre casual"],
    weatherTip: "Idéal par temps doux. Ajoute une veste légère si le vent se lève.",
    culturalTip: "Tenue passe-partout acceptée dans la majorité des lieux publics.",
  },
  {
    title: "Tenue Soirée Élégante",
    context: "Dîner gastronomique • Soirée",
    tags: ["Restaurant", "20°C", "Ville"],
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    badge: "Raffiné",
    items: ["Chemise en lin", "Pantalon chino", "Mocassins cuir", "Montre habillée", "Pochette élégante"],
    weatherTip: "Prévois un blazer léger : les soirées peuvent être fraîches.",
    culturalTip: "Certains restaurants exigent une tenue soignée. Renseigne-toi.",
  },
  {
    title: "Look Exploration Nature",
    context: "Randonnée • Découverte",
    tags: ["Nature", "Variable", "Aventure"],
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&q=80",
    badge: "Aventurier",
    items: ["T-shirt technique", "Pantalon convertible", "Chaussures de trail", "Sac à dos 20L", "Casquette UV"],
    weatherTip: "Superpose les couches pour t'adapter aux variations de température.",
    culturalTip: "Certains sites naturels demandent de couvrir les épaules et genoux.",
  },
  {
    title: "Look Beach & Détente",
    context: "Plage • Bord de mer",
    tags: ["Plage", "28°C+", "Relaxation"],
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    badge: "Relax",
    items: ["Maillot de bain", "Short en lin", "Chemise hawaienne", "Sandales", "Lunettes polarisées"],
    weatherTip: "Crème solaire SPF 50 obligatoire. Hydrate-toi régulièrement.",
    culturalTip: "Le topless n'est pas accepté partout. Vérifie les coutumes locales.",
  },
  {
    title: "Look Business Travel",
    context: "Réunion • Conférence",
    tags: ["Business", "Intérieur", "Pro"],
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
    badge: "Pro",
    items: ["Costume ajusté", "Chemise repassée", "Chaussures Oxford", "Cravate/foulard", "Mallette"],
    weatherTip: "Les salles de conférence sont souvent climatisées : prévois une couche.",
    culturalTip: "Dans certains pays, la carte de visite se remet à deux mains.",
  },
];

// Map trip types to relevant outfits
function getRelevantOutfits(tripType?: string): Outfit[] {
  if (!tripType) return allOutfits.slice(0, 3);
  const lower = tripType.toLowerCase();
  if (lower.includes("plage") || lower.includes("relax") || lower.includes("balnéaire"))
    return allOutfits.filter((o) => ["Relax", "Détendu"].includes(o.badge));
  if (lower.includes("business") || lower.includes("professionnel"))
    return allOutfits.filter((o) => ["Pro", "Raffiné"].includes(o.badge));
  if (lower.includes("aventure") || lower.includes("rando") || lower.includes("nature"))
    return allOutfits.filter((o) => ["Aventurier", "Détendu"].includes(o.badge));
  return allOutfits.slice(0, 3);
}

const OutfitRecommendations = ({ tripType, destination }: OutfitRecommendationsProps) => {
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const outfits = getRelevantOutfits(tripType);

  // If dynamic filtering yields nothing, show defaults
  const displayOutfits = outfits.length > 0 ? outfits : allOutfits.slice(0, 3);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="space-y-5"
      >
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground">Tenues recommandées</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Looks adaptés à tes activités, la météo et le contexte culturel
            {destination && destination !== "votre destination" && (
              <> — <span className="text-primary font-medium">{destination}</span></>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {displayOutfits.map((outfit, i) => (
            <motion.button
              key={outfit.title}
              onClick={() => setSelectedOutfit(outfit)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card rounded-2xl overflow-hidden group text-left cursor-pointer"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={outfit.imageUrl}
                  alt={outfit.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-primary/20 backdrop-blur-md text-primary text-[10px] font-bold uppercase tracking-wider">
                  {outfit.badge}
                </span>
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/40 backdrop-blur-sm">
                  <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
                    <Eye className="w-3.5 h-3.5" /> Voir les détails
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">{outfit.title}</h4>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
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
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Detail modal */}
      <Dialog open={!!selectedOutfit} onOpenChange={() => setSelectedOutfit(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          {selectedOutfit && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-primary" />
                  {selectedOutfit.title}
                </DialogTitle>
              </DialogHeader>

              <div className="relative h-48 rounded-xl overflow-hidden mt-2">
                <img
                  src={selectedOutfit.imageUrl}
                  alt={selectedOutfit.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-primary/20 backdrop-blur text-primary text-xs font-bold">
                  {selectedOutfit.badge}
                </span>
              </div>

              {/* Composition */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Composition de la tenue
                </h4>
                <div className="space-y-1.5">
                  {selectedOutfit.items.map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <p className="text-sm text-foreground">{item}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="grid grid-cols-1 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-primary/5 flex items-start gap-2">
                  <CloudSun className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Conseil météo</p>
                    <p className="text-xs text-foreground mt-0.5">{selectedOutfit.weatherTip}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-secondary/5 flex items-start gap-2">
                  <Thermometer className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Conseil culturel</p>
                    <p className="text-xs text-foreground mt-0.5">{selectedOutfit.culturalTip}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OutfitRecommendations;
