ALTER TABLE public.gam_current_missions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS gam_current_missions_user_scope_idx
  ON public.gam_current_missions (user_id, scope, active);

-- Replace SELECT policy to allow user-personal + global rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gam_current_missions' AND policyname='Anyone read missions') THEN
    DROP POLICY "Anyone read missions" ON public.gam_current_missions;
  END IF;
END $$;

CREATE POLICY "Read own or global missions"
ON public.gam_current_missions
FOR SELECT
TO authenticated
USING (user_id IS NULL OR user_id = auth.uid());