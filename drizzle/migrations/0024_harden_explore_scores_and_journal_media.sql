-- 1) Trip score rows are computed by the recalc triggers only (SECURITY DEFINER).
--    Users keep read + delete (trip deletion), but can no longer write scores.
DROP POLICY IF EXISTS "Users insert own progress" ON public.explore_progress;
DROP POLICY IF EXISTS "Users update own progress" ON public.explore_progress;

-- 2) Node points are derived server-side from level / type / source,
--    never taken from the caller.
CREATE OR REPLACE FUNCTION public.enforce_explore_node_points()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.level = 1 THEN
    NEW.points := 100;
  ELSIF NEW.source = 'manual' THEN
    NEW.points := CASE NEW.type
      WHEN 'place' THEN 30
      WHEN 'food' THEN 40
      WHEN 'culture' THEN 50
      WHEN 'nature' THEN 40
      WHEN 'nightlife' THEN 50
      WHEN 'activity' THEN 60
      WHEN 'hotel' THEN 20
      ELSE 50
    END;
  ELSIF NEW.level = 3 THEN
    NEW.points := 30;
  ELSE
    NEW.points := 50;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_explore_node_points ON public.explore_nodes;
CREATE TRIGGER trg_enforce_explore_node_points
BEFORE INSERT OR UPDATE ON public.explore_nodes
FOR EACH ROW EXECUTE FUNCTION public.enforce_explore_node_points();

-- 3) Journal media of a PUBLIC journal can be signed (short-lived) by viewers;
--    as soon as sharing is turned off, no new link can be created.
CREATE OR REPLACE FUNCTION public.is_public_journal_media(_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.journal_blocks b
    JOIN public.journals j ON j.id = b.journal_id
    WHERE j.is_public = true
      AND _name IS NOT NULL
      AND b.content->>'path' = _name
  );
$$;

CREATE INDEX IF NOT EXISTS journal_blocks_content_path_idx
  ON public.journal_blocks ((content->>'path'));

DROP POLICY IF EXISTS "Public journal media can be read" ON storage.objects;
CREATE POLICY "Public journal media can be read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'journal-media' AND public.is_public_journal_media(name));