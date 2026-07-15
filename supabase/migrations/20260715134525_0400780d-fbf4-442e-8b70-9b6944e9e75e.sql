
-- 1) Explicit deny: no client (anon/authenticated) may INSERT/UPDATE/DELETE user_roles.
-- RLS is already enabled and only a SELECT policy exists, so writes were already
-- blocked. We add explicit restrictive-style policies for defense in depth and
-- documentation clarity.
DROP POLICY IF EXISTS "No client writes on user_roles" ON public.user_roles;
CREATE POLICY "No client writes on user_roles"
  ON public.user_roles
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- Keep the existing self-read policy (idempotent recreate)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Ensure the auto-grant trigger for the owner email is attached.
DROP TRIGGER IF EXISTS auto_grant_admin_juliette_trg ON auth.users;
CREATE TRIGGER auto_grant_admin_juliette_trg
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_grant_admin_juliette();

-- 2b) Backfill: if the owner already signed up before the trigger existed,
-- grant admin now (no-op if row already exists).
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) = 'juliette7740@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3) Convenience helper the client can call to check its own admin status.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
