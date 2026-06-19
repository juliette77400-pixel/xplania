
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
        OR realtime.topic() = 'mood_reactions:' || auth.uid()::text
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
      OR realtime.topic() = 'mood_reactions:' || auth.uid()::text
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
