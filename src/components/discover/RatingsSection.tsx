import { useEffect, useState } from "react";
import { Loader2, Pencil, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { RATING_TAGS, usePlaceRatings } from "@/hooks/usePlaceRatings";
import { toast } from "sonner";

interface Props {
  placeId: string;
}

const StarRating = ({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
}) => {
  const { t } = useTranslation();
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
          className={cn(onChange ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default")}
          aria-label={t("discoverComp.ratings.starAria", { count: n })}
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

const RatingsSection = ({ placeId }: Props) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { ratings, loading, submitting, submit, remove, userRating, avg } = usePlaceRatings(placeId);
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const dateLocale = i18n.language?.startsWith("fr") ? fr : enUS;

  useEffect(() => {
    if (userRating) {
      setStars(userRating.rating);
      setTags(userRating.tags || []);
      setComment(userRating.comment || "");
    } else {
      setStars(0);
      setTags([]);
      setComment("");
    }
  }, [userRating, open]);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : prev.length >= 6 ? prev : [...prev, tag],
    );
  };

  const handleSubmit = async () => {
    if (stars === 0) return;
    const ok = await submit(stars, tags, comment);
    if (ok) {
      toast.success(userRating ? t("discoverComp.ratings.updated") : t("discoverComp.ratings.published"));
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    const ok = await remove();
    if (ok) toast.success(t("discoverComp.ratings.deleted"));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("discoverComp.ratings.title", { count: ratings.length })}
          </h3>
          {ratings.length > 0 && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{avg.toFixed(1)}</span>
              <span>· {t("discoverComp.ratings.basedOn", { count: ratings.length })}</span>
            </div>
          )}
        </div>
        {user && (
          <Button size="sm" variant={userRating ? "outline" : "default"} onClick={() => setOpen((v) => !v)}>
            {open ? (
              t("discoverComp.ratings.cancel")
            ) : userRating ? (
              <>
                <Pencil className="mr-2 h-3.5 w-3.5" /> {t("discoverComp.ratings.editMine")}
              </>
            ) : (
              t("discoverComp.ratings.rateThis")
            )}
          </Button>
        )}
      </div>

      {!user && (
        <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          {t("discoverComp.ratings.loginPrompt")}
        </p>
      )}

      {open && user && (
        <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium">{t("discoverComp.ratings.yourRating")}</span>
            <StarRating value={stars} onChange={setStars} />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium">
              {t("discoverComp.ratings.tagsLabel")}{" "}
              <span className="text-muted-foreground">({tags.length}/6)</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RATING_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50",
                    )}
                  >
                    #{t(`discoverComp.ratings.tags.${tag}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder={t("discoverComp.ratings.commentPlaceholder")}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center gap-2">
            {userRating && (
              <Button size="sm" variant="ghost" onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> {t("discoverComp.ratings.delete")}
              </Button>
            )}
            <Button size="sm" className="ml-auto" disabled={stars === 0 || submitting} onClick={handleSubmit}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {userRating ? t("discoverComp.ratings.update") : t("discoverComp.ratings.publish")}
            </Button>
          </div>
        </div>
      )}

      {loading && ratings.length === 0 && (
        <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("discoverComp.ratings.loading")}
        </div>
      )}

      {!loading && ratings.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">{t("discoverComp.ratings.empty")}</p>
      )}

      <ul className="space-y-3">
        {ratings.map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-card/30 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={r.author?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(r.author?.display_name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {r.author?.display_name || t("discoverComp.ratings.anonAuthor")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(r.updated_at), { addSuffix: true, locale: dateLocale })}
                </p>
              </div>
              <StarRating value={r.rating} size={14} />
            </div>
            {r.tags && r.tags.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {r.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    #{t(`discoverComp.ratings.tags.${tag}`, tag)}
                  </span>
                ))}
              </div>
            )}
            {r.comment && <p className="text-sm text-foreground/90">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RatingsSection;
