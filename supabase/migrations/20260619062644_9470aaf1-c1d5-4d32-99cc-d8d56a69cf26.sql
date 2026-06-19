
-- 1) Remove broad anon SELECT policies on shared trip data; expose only via slug-gated RPCs
DROP POLICY IF EXISTS "Public can view shared tracking" ON public.trip_tracking;
DROP POLICY IF EXISTS "Public view shared activities" ON public.trip_activities;
DROP POLICY IF EXISTS "Public view shared positions" ON public.trip_positions;

CREATE OR REPLACE FUNCTION public.get_public_trip_tracking(_slug text)
RETURNS SETOF public.trip_tracking
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.trip_tracking
  WHERE share_slug IS NOT NULL
    AND _slug IS NOT NULL
    AND length(_slug) >= 6
    AND share_slug = _slug
    AND share_enabled = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_public_trip_activities(_slug text)
RETURNS SETOF public.trip_activities
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.* FROM public.trip_activities a
  JOIN public.trip_tracking t ON t.trip_id = a.trip_id
  WHERE t.share_slug IS NOT NULL
    AND _slug IS NOT NULL
    AND length(_slug) >= 6
    AND t.share_slug = _slug
    AND t.share_enabled = true
  ORDER BY a.day_date, a.position;
$$;

CREATE OR REPLACE FUNCTION public.get_public_trip_positions(_slug text)
RETURNS TABLE(lat double precision, lng double precision, recorded_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.lat, p.lng, p.recorded_at FROM public.trip_positions p
  JOIN public.trip_tracking t ON t.trip_id = p.trip_id
  WHERE t.share_slug IS NOT NULL
    AND _slug IS NOT NULL
    AND length(_slug) >= 6
    AND t.share_slug = _slug
    AND t.share_enabled = true
  ORDER BY p.recorded_at;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_trip_tracking(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_activities(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_positions(text) TO anon, authenticated;

-- 2) Realtime: restrict pub-* channels to topics whose slug matches an enabled shared trip
DROP POLICY IF EXISTS "Scoped realtime read" ON realtime.messages;
DROP POLICY IF EXISTS "Scoped realtime write" ON realtime.messages;

CREATE POLICY "Scoped realtime read"
  ON realtime.messages
  FOR SELECT
  TO anon, authenticated
  USING (
    (
      realtime.topic() LIKE 'pub-%'
      AND EXISTS (
        SELECT 1 FROM public.trip_tracking t
        WHERE t.share_slug = substring(realtime.topic() from 5)
          AND t.share_enabled = true
          AND t.share_slug IS NOT NULL
      )
    )
    OR (
      auth.uid() IS NOT NULL AND (
        realtime.topic() = 'notif-' || auth.uid()::text
        OR (
          realtime.topic() LIKE 'tracking-%'
          AND EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id::text = substring(realtime.topic() from 10)
              AND t.user_id = auth.uid()
          )
        )
        OR (
          realtime.topic() LIKE 'explore-%'
          AND EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id::text = substring(realtime.topic() from 9)
              AND t.user_id = auth.uid()
          )
        )
        OR realtime.topic() LIKE 'mood_reactions:%'
      )
    )
  );

CREATE POLICY "Scoped realtime write"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      realtime.topic() = 'notif-' || auth.uid()::text
      OR (
        realtime.topic() LIKE 'tracking-%'
        AND EXISTS (
          SELECT 1 FROM public.trips t
          WHERE t.id::text = substring(realtime.topic() from 10)
            AND t.user_id = auth.uid()
        )
      )
      OR (
        realtime.topic() LIKE 'explore-%'
        AND EXISTS (
          SELECT 1 FROM public.trips t
          WHERE t.id::text = substring(realtime.topic() from 9)
            AND t.user_id = auth.uid()
        )
      )
      OR realtime.topic() LIKE 'mood_reactions:%'
      OR (
        realtime.topic() LIKE 'pub-%'
        AND EXISTS (
          SELECT 1 FROM public.trip_tracking t
          WHERE t.share_slug = substring(realtime.topic() from 5)
            AND t.share_enabled = true
            AND t.share_slug IS NOT NULL
        )
      )
    )
  );
