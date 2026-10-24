-- Activity timestamps used by the leaderboard's daily caps are set by the
-- server, never by the caller (insert = now(), update keeps the original).
CREATE OR REPLACE FUNCTION public.force_server_created_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
  ELSE
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.force_server_saved_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.saved_at := now();
  ELSE
    NEW.saved_at := OLD.saved_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_server_created_at ON public.journal_blocks;
CREATE TRIGGER trg_server_created_at BEFORE INSERT OR UPDATE ON public.journal_blocks
FOR EACH ROW EXECUTE FUNCTION public.force_server_created_at();

DROP TRIGGER IF EXISTS trg_server_created_at ON public.place_reviews;
CREATE TRIGGER trg_server_created_at BEFORE INSERT OR UPDATE ON public.place_reviews
FOR EACH ROW EXECUTE FUNCTION public.force_server_created_at();

DROP TRIGGER IF EXISTS trg_server_created_at ON public.mood_reactions;
CREATE TRIGGER trg_server_created_at BEFORE INSERT OR UPDATE ON public.mood_reactions
FOR EACH ROW EXECUTE FUNCTION public.force_server_created_at();

DROP TRIGGER IF EXISTS trg_server_saved_at ON public.mood_favorites;
CREATE TRIGGER trg_server_saved_at BEFORE INSERT OR UPDATE ON public.mood_favorites
FOR EACH ROW EXECUTE FUNCTION public.force_server_saved_at();