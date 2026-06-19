
-- 1) place_reviews: restrict SELECT to authenticated to avoid exposing user_id publicly
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.place_reviews;
CREATE POLICY "Reviews viewable by authenticated"
  ON public.place_reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- 2) realtime.messages: scope per-topic access
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write realtime messages" ON realtime.messages;

CREATE POLICY "Scoped realtime read"
  ON realtime.messages
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Public shared trip channels (anon + auth)
    (realtime.topic() LIKE 'pub-%')
    OR (
      auth.uid() IS NOT NULL AND (
        -- Per-user notifications channel
        realtime.topic() = 'notif-' || auth.uid()::text
        -- Tracking channels: owner of the trip
        OR (
          realtime.topic() LIKE 'tracking-%'
          AND EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id::text = substring(realtime.topic() from 10)
              AND t.user_id = auth.uid()
          )
        )
        -- Explore channels: owner of the trip
        OR (
          realtime.topic() LIKE 'explore-%'
          AND EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id::text = substring(realtime.topic() from 9)
              AND t.user_id = auth.uid()
          )
        )
        -- Mood reactions channels (per place, public to authenticated users)
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
      OR realtime.topic() LIKE 'pub-%'
    )
  );
