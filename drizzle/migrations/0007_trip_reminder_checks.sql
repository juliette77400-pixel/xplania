CREATE TABLE IF NOT EXISTS public.trip_reminder_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item text NOT NULL CHECK (length(item) <= 40),
  done_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, item)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_reminder_checks TO authenticated;
GRANT ALL ON public.trip_reminder_checks TO service_role;
ALTER TABLE public.trip_reminder_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view reminder checks" ON public.trip_reminder_checks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners insert reminder checks" ON public.trip_reminder_checks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Owners update reminder checks" ON public.trip_reminder_checks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners delete reminder checks" ON public.trip_reminder_checks FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS trip_reminder_checks_trip_id_idx ON public.trip_reminder_checks (trip_id);