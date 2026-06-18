
-- 1) Profiles: restrict SELECT to owner only
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2) Places: require ownership for UPDATE (no NULL-created_by loophole)
DROP POLICY IF EXISTS "Users can update their own places" ON public.places;
CREATE POLICY "Users can update their own places"
  ON public.places
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by AND created_by IS NOT NULL)
  WITH CHECK (auth.uid() = created_by AND created_by IS NOT NULL);

-- 3) Realtime: restrict broadcast/presence writes to authenticated users.
--    postgres_changes still enforces RLS on the underlying source tables.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'realtime' AND c.relname = 'messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Authenticated can read realtime messages"
        ON realtime.messages
        FOR SELECT
        TO authenticated, anon
        USING (true)
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can write realtime messages" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Authenticated can write realtime messages"
        ON realtime.messages
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() IS NOT NULL)
    $p$;
  END IF;
END $$;
