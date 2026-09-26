CREATE TABLE IF NOT EXISTS public.trip_reminder_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item text NOT NULL,
  done_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, item)
);

ALTER TABLE public.trip_reminder_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their reminder checks"
  ON public.trip_reminder_checks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owners can insert their reminder checks"
  ON public.trip_reminder_checks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can update their reminder checks"
  ON public.trip_reminder_checks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can delete their reminder checks"
  ON public.trip_reminder_checks FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_reminder_checks TO authenticated;

CREATE INDEX IF NOT EXISTS trip_reminder_checks_trip_id_idx ON public.trip_reminder_checks (trip_id);
