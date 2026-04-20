import { Heart } from "lucide-react";
import MoodPlaceCard from "./MoodPlaceCard";
import type { MoodFavorite, MoodPlace } from "@/hooks/useMoodExplorer";

interface Props {
  favorites: MoodFavorite[];
  onToggleFavorite: (place: MoodPlace) => void;
}

const MoodFavorites = ({ favorites, onToggleFavorite }: Props) => {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Aucun favori pour l'instant.</p>
        <p className="text-xs mt-1">Tape sur ❤️ sur un lieu pour le sauvegarder.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {favorites.map((f) =>
        f.place ? (
          <MoodPlaceCard
            key={f.id}
            place={f.place}
            isFavorite={true}
            onToggleFavorite={() => onToggleFavorite(f.place!)}
          />
        ) : null,
      )}
    </div>
  );
};

export default MoodFavorites;
