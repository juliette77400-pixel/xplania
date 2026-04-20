import { useRef, useState } from "react";
import { Camera, Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePlaceReviews } from "@/hooks/usePlaceReviews";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  placeId: string;
}

const StarRating = ({ value, onChange, size = 24 }: { value: number; onChange?: (n: number) => void; size?: number }) => {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(n)}
          className={cn(onChange && "cursor-pointer transition-transform hover:scale-110", !onChange && "cursor-default")}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(n <= display ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
            style={{ width: size, height: size }}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewsSection = ({ placeId }: Props) => {
  const { user } = useAuth();
  const { reviews, loading, submitting, submit, userReview } = usePlaceReviews(placeId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setRating(0);
    setComment("");
    setPhoto(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    const ok = await submit(rating, comment, photo);
    if (ok) {
      reset();
      setOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Avis ({reviews.length})
        </h3>
        {user && !userReview && (
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? "Annuler" : "Écrire un avis"}
          </Button>
        )}
      </div>

      {!user && (
        <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Connecte-toi pour partager ton avis sur ce lieu.
        </p>
      )}

      {user && userReview && (
        <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          ✓ Tu as déjà donné ton avis sur ce lieu.
        </p>
      )}

      {open && user && !userReview && (
        <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium">Ta note :</span>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="Partage ton expérience (optionnel, 500 car. max)…"
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <Button size="sm" variant="outline" type="button" onClick={() => fileRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" />
              {photo ? "Changer photo" : "Ajouter photo"}
            </Button>
            {photoPreview && (
              <div className="relative">
                <img src={photoPreview} alt="aperçu" className="h-12 w-12 rounded-md object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                  aria-label="Retirer photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <Button size="sm" className="ml-auto" disabled={rating === 0 || submitting} onClick={handleSubmit}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publier
            </Button>
          </div>
        </div>
      )}

      {loading && reviews.length === 0 && (
        <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement…
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Aucun avis pour le moment. Sois le premier à partager !
        </p>
      )}

      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-card/30 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={r.author?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(r.author?.display_name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium">{r.author?.display_name || "Voyageur"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                </p>
              </div>
              <StarRating value={r.rating} size={14} />
            </div>
            {r.comment && <p className="text-sm text-foreground/90">{r.comment}</p>}
            {r.photo_url && (
              <img
                src={r.photo_url}
                alt="Photo de l'avis"
                loading="lazy"
                className="mt-2 max-h-48 w-full rounded-lg object-cover"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReviewsSection;
