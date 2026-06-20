
CREATE TABLE public.place_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (place_id, user_id)
);

CREATE INDEX idx_place_ratings_place ON public.place_ratings(place_id);
CREATE INDEX idx_place_ratings_user ON public.place_ratings(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.place_ratings TO authenticated;
GRANT SELECT ON public.place_ratings TO anon;
GRANT ALL ON public.place_ratings TO service_role;

ALTER TABLE public.place_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings readable by everyone"
  ON public.place_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users insert own rating"
  ON public.place_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own rating"
  ON public.place_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own rating"
  ON public.place_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_place_ratings_updated_at
  BEFORE UPDATE ON public.place_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.recalc_place_rating_combined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_place UUID;
  v_avg NUMERIC;
  v_count INT;
BEGIN
  v_place := COALESCE(NEW.place_id, OLD.place_id);
  SELECT COALESCE(AVG(r), 0), COUNT(*) INTO v_avg, v_count
  FROM (
    SELECT rating::numeric AS r FROM public.place_ratings WHERE place_id = v_place
    UNION ALL
    SELECT rating::numeric AS r FROM public.place_reviews WHERE place_id = v_place
  ) s;
  UPDATE public.places
    SET rating_avg = ROUND(v_avg, 2),
        rating_count = v_count,
        updated_at = now()
  WHERE id = v_place;
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recalc_place_rating_combined() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_recalc_place_rating_from_ratings
  AFTER INSERT OR UPDATE OR DELETE ON public.place_ratings
  FOR EACH ROW EXECUTE FUNCTION public.recalc_place_rating_combined();
