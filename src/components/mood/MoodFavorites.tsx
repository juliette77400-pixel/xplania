import { Heart, Download, Mail, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MoodPlaceCard from "./MoodPlaceCard";
import type { MoodFavorite, MoodPlace } from "@/hooks/useMoodExplorer";
import {
  exportMoodFavoritesPDF,
  shareMoodFavoritesByEmail,
  shareMoodFavoritesNative,
} from "@/lib/mood-export";

interface Props {
  favorites: MoodFavorite[];
  onToggleFavorite: (place: MoodPlace) => void;
  onOpenDetails?: (place: MoodPlace) => void;
}

const MoodFavorites = ({ favorites, onToggleFavorite, onOpenDetails }: Props) => {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Aucun favori pour l'instant.</p>
        <p className="text-xs mt-1">Tape sur ❤️ sur un lieu pour le sauvegarder.</p>
      </div>
    );
  }

  const handleShare = async () => {
    const ok = await shareMoodFavoritesNative(favorites);
    if (!ok) {
      shareMoodFavoritesByEmail(favorites);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <p className="text-sm text-muted-foreground">
          {favorites.length} lieu{favorites.length > 1 ? "x" : ""} sauvegardé{favorites.length > 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => { exportMoodFavoritesPDF(favorites); toast.success("PDF téléchargé"); }}>
            <Download className="w-4 h-4 mr-1.5" /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => shareMoodFavoritesByEmail(favorites)}>
            <Mail className="w-4 h-4 mr-1.5" /> Email
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1.5" /> Partager
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favorites.map((f) =>
          f.place ? (
            <MoodPlaceCard
              key={f.id}
              place={f.place}
              isFavorite={true}
              onToggleFavorite={() => onToggleFavorite(f.place!)}
              onOpenDetails={onOpenDetails ? () => onOpenDetails(f.place!) : undefined}
            />
          ) : null,
        )}
      </div>
    </div>
  );
};

export default MoodFavorites;
